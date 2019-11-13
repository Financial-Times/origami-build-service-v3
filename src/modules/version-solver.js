"use strict";

const { Map, Set } = require("immutable");
const { ConflictCause } = require("./conflict-cause");
const { minByAsync } = require("./home");
const { PackageNotFoundError } = require("./errors");
const { Incompatibility } = require("./incompatibility");
const { IncompatibilityCause } = require("./incompatibility-cause");
const { PackageLister } = require("./package-lister");
const { PackageNotFoundCause } = require("./package-not-found-cause");
const { PackageRange } = require("./package-name");
const { PartialSolution } = require("./partial-solution");
const { reformatRanges } = require("./reformat-ranges");
const { SetRelation } = require("./set-relation");
const { SolveFailure } = require("./solve-failure");
const { SolveResult } = require("./solve-result");
const { Term } = require("./term");
const { Version } = require("./version");
const { VersionConstraint } = require("./version");
const log = require("./log");

/**
 * The version solver that finds a set of package versions that satisfy the
 * root package's dependencies.
 *
 * See https://github.com/dart-lang/pub/tree/master/doc/solver.md for details
 * on how this solver works.
 *
 * @class VersionSolver
 */
class VersionSolver {
  /**
   * Creates an instance of VersionSolver.
   *
   * @param {import('./system-cache').SystemCache} _systemCache
   * @param {import('./package').Package} _root
   * @memberof VersionSolver
   */
  constructor(_systemCache, _root) {
    /**
     * All known incompatibilities, indexed by package name.
     * Each incompatibility is indexed by each package it refers to, and so may
     * appear in multiple values.
     * @type {Object.<string, Array<Incompatibility>>}
     */
    this._incompatibilities = {};
    /**
     * The partial solution that contains package versions we've selected and
     * assignments we've derived from those versions and [_incompatibilities].
     * @type {import('./partial-solution').PartialSolution}
     */
    this._solution = new PartialSolution();
    /**
     * Package listers that lazily convert package versions' dependencies into incompatibilities.
     * @type {import("immutable").Map<import('./package-name').PackageRef, import('./package-lister').PackageLister>}
     */
    this._packageListers = Map();
    /**
     * The system cache in which packages are stored.
     * @type {import('./system-cache').SystemCache}
     */
    this._systemCache = _systemCache;
    /**
     * The entrypoint package, whose dependencies seed the version solve process.
     * @type {import('./package').Package}
     */
    this._root = _root;
  }

  /**
   * Finds a set of dependencies that match the root package's constraints, or
   * throws an error if no such set is available.
   *
   * @returns {Promise<import('./solve-result').SolveResult>}
   * @memberof VersionSolver
   */
  async solve() {
    const stopwatch = process.hrtime();
    this._addIncompatibility(
      new Incompatibility(
        [new Term(PackageRange.root(this._root), false)],
        IncompatibilityCause.root,
      ),
    );
    try {
      let next = this._root.name || null;
      while (next != null) {
        this._propagate(next);
        next = await this._choosePackageVersion();
      }

      return await this._result();
    } finally {
      // Gather some solving metrics.
      log(
        `Version solving took ${process.hrtime(stopwatch)} seconds.\nTried ${
          this._solution.attemptedSolutions
        } solutions.`,
      );
    }
  }

  /**
   * Performs "unit propagation" on incompatibilities transitively related to
   * `package` to derive new assignments for `_solution`.
   *
   * @param {string} $package
   * @memberof VersionSolver
   * @see {@link https://github.com/dart-lang/pub/tree/master/doc/solver.md#unit-propagation }
   */
  _propagate($package) {
    let changed = Set([$package]);
    while (!changed.isEmpty()) {
      const $package = changed.first();
      changed = changed.remove($package);
      // Iterate in reverse because conflict resolution tends to produce more
      // general incompatibilities as time goes on. If we look at those first,
      // we can derive stronger assignments sooner and more eagerly find
      // conflicts.
      const incompatibilities = Array.from(this._incompatibilities[$package]);
      for (const incompatibility of incompatibilities.reverse()) {
        const result = this._propagateIncompatibility(incompatibility);
        if (result == Symbol.for("conflict")) {
          // If `incompatibility` is satisfied by `_solution`, we use
          // `_resolveConflict` to determine the root cause of the conflict as a
          // new incompatibility. It also backjumps to a point in `_solution`
          // where that incompatibility will allow us to derive new assignments
          // that avoid the conflict.
          const rootCause = this._resolveConflict(incompatibility);
          // Backjumping erases all the assignments we did at the previous
          // decision level, so we clear `changed` and refill it with the
          // newly-propagated assignment.
          changed = changed.clear();
          const result = this._propagateIncompatibility(rootCause);
          if (typeof result == "string") {
            changed = changed.add(result);
          }
          break;
        } else if (typeof result == "string") {
          changed = changed.add(result);
        }
      }
    }
  }

  /**
   * If `incompatibility` is "almost satisfied" by `_solution`, adds the
   * negation of the unsatisfied term to `_solution`.
   *
   * @see {@link https://github.com/dart-lang/pub/tree/master/doc/solver.md#incompatibility }
   *
   * If `incompatibility` is satisfied by `_solution`, returns `conflict` Symbol. If
   * `incompatibility` is almost satisfied by `_solution`, returns the
   * unsatisfied term's package name. Otherwise, returns `none` Symbol.
   *
   * @param {import('./incompatibility').Incompatibility} incompatibility
   * @returns {string|Symbol}
   * @memberof VersionSolver
   */
  _propagateIncompatibility(incompatibility) {
    // The first entry in `incompatibility.terms` that's not yet satisfied by
    // `_solution`, if one exists. If we find more than one, `_solution` is
    // inconclusive for `incompatibility` and we can't deduce anything.
    let unsatisfied;
    for (const term of incompatibility.terms) {
      const relation = this._solution.relation(term);
      if (relation == SetRelation.disjoint) {
        // If `term` is already contradicted by `_solution`, then
        // `incompatibility` is contradicted as well and there's nothing new we
        // can deduce from it.
        return Symbol.for("none");
      } else if (relation == SetRelation.overlapping) {
        // If more than one term is inconclusive, we can't deduce anything about
        // `incompatibility`.
        if (unsatisfied != null) {
          return Symbol.for("none");
        }
        // If exactly one term in `incompatibility` is inconclusive, then it's
        // almost satisfied and `term` is the unsatisfied term. We can add the
        // inverse of the term to `_solution`.
        unsatisfied = term;
      }
    }
    // If *all* terms in `incompatibility` are satsified by `_solution`, then
    // `incompatibility` is satisfied and we have a conflict.
    if (unsatisfied == null) {
      return Symbol.for("conflict");
    }
    log(
      `derived: ${
        unsatisfied.isPositive ? "not " : ""
      }${unsatisfied.package.toString()}`,
    );
    this._solution.derive(
      unsatisfied.package,
      !unsatisfied.isPositive,
      incompatibility,
    );

    return unsatisfied.package.name;
  }

  /**
   * Given an `incompatibility` that's satisfied by `_solution`, `conflict
   * resolution` constructs a new incompatibility that encapsulates the root
   * cause of the conflict and backtracks `_solution` until the new
   * incompatibility will allow `_propagate` to deduce new assignments.
   *
   * @see {@link https://github.com/dart-lang/pub/tree/master/doc/solver.md#conflict-resolution }
   *
   * @param {import('./incompatibility').Incompatibility} incompatibility
   * @returns {import('./incompatibility').Incompatibility}
   * @memberof VersionSolver
   */
  _resolveConflict(incompatibility) {
    let newIncompatibility = false;
    while (!incompatibility.isFailure) {
      // The term in `incompatibility.terms` that was most recently satisfied by
      // `_solution`.
      let mostRecentTerm;
      // The earliest assignment in `_solution` such that `incompatibility` is
      // satisfied by `_solution` up to and including this assignment.
      let mostRecentSatisfier;
      // The difference between `mostRecentSatisfier` and `mostRecentTerm`;
      // that is, the versions that are allowed by `mostRecentSatisfier` and not
      // by `mostRecentTerm`. This is `null` if `mostRecentSatisfier` totally
      // satisfies `mostRecentTerm`.
      let difference;
      // The decision level of the earliest assignment in `_solution *before*
      // `mostRecentSatisfier` such that `incompatibility` is satisfied by
      // `_solution` up to and including this assignment plus
      // `mostRecentSatisfier`.
      //
      // Decision level 1 is the level where the root package was selected. It's
      // safe to go back to decision level 0, but stopping at 1 tends to produce
      // better error messages, because references to the root package end up
      // closer to the final conclusion that no solution exists.
      let previousSatisfierLevel = 1;
      for (const term of incompatibility.terms) {
        const satisfier = this._solution.satisfier(term);
        if (mostRecentSatisfier == null) {
          mostRecentTerm = term;
          mostRecentSatisfier = satisfier;
        } else if (mostRecentSatisfier.index < satisfier.index) {
          previousSatisfierLevel = Math.max(
            previousSatisfierLevel,
            mostRecentSatisfier.decisionLevel,
          );
          mostRecentTerm = term;
          mostRecentSatisfier = satisfier;
          difference = null;
        } else {
          previousSatisfierLevel = Math.max(
            previousSatisfierLevel,
            satisfier.decisionLevel,
          );
        }
        if (mostRecentTerm == term) {
          // If `mostRecentSatisfier` doesn't satisfy `mostRecentTerm` on its
          // own, then the next-most-recent satisfier may be the one that
          // satisfies the remainder.
          difference = mostRecentSatisfier.difference(mostRecentTerm);
          if (difference != null) {
            previousSatisfierLevel = Math.max(
              previousSatisfierLevel,
              this._solution.satisfier(difference.inverse).decisionLevel,
            );
          }
        }
      }
      if (!mostRecentSatisfier) {
        throw new Error("mostRecentSatisfier is undefined.");
      }
      // If `mostRecentSatisfier` is the only satisfier left at its decision
      // level, or if it has no cause (indicating that it's a decision rather
      // than a derivation), then `incompatibility` is the root cause. We then
      // backjump to `previousSatisfierLevel`, where `incompatibility` is
      // guaranteed to allow `_propagate` to produce more assignments.
      if (
        previousSatisfierLevel < mostRecentSatisfier.decisionLevel ||
        mostRecentSatisfier.cause == null
      ) {
        this._solution.backtrack(previousSatisfierLevel);
        if (newIncompatibility) {
          this._addIncompatibility(incompatibility);
        }

        return incompatibility;
      }
      // Create a new incompatibility by combining `incompatibility` with the
      // incompatibility that caused `mostRecentSatisfier` to be assigned. Doing
      // this iteratively constructs an incompatibility that's guaranteed to be
      // true (that is, we know for sure no solution will satisfy the
      // incompatibility) while also approximating the intuitive notion of the
      // "root cause" of the conflict.
      const newTerms = incompatibility.terms
        .filter(term => term != mostRecentTerm)
        .concat(
          mostRecentSatisfier.cause.terms.filter(
            term => term.package != mostRecentSatisfier.package,
          ),
        );
      // The `mostRecentSatisfier` may not satisfy `mostRecentTerm` on its own
      // if there are a collection of constraints on `mostRecentTerm` that
      // only satisfy it together. For example, if `mostRecentTerm` is
      // `foo ^1.0.0` and `_solution` contains `[foo >=1.0.0,
      // foo <2.0.0]`, then `mostRecentSatisfier` will be `foo <2.0.0` even
      // though it doesn't totally satisfy `foo ^1.0.0`.
      //
      // In this case, we add `not (mostRecentSatisfier \ mostRecentTerm)` to
      // the incompatibility as well, See `the algorithm documentation` for
      // details.
      //
      // `the algorithm documentation`: https://github.com/dart-lang/pub/tree/master/doc/solver.md#conflict-resolution
      if (difference != null) {
        newTerms.push(difference.inverse);
      }
      incompatibility = new Incompatibility(
        newTerms,
        new ConflictCause(incompatibility, mostRecentSatisfier.cause),
      );
      newIncompatibility = true;
      const partially = difference == null ? "" : " partially";
      const bang = "!";
      log(
        `${bang} ${mostRecentTerm} is${partially} satisfied by ${mostRecentSatisfier}`,
      );
      log(`${bang} which is caused by "${mostRecentSatisfier.cause}"`);
      log(`${bang} thus: ${incompatibility}`);
    }
    throw new SolveFailure(
      reformatRanges(this._packageListers, incompatibility),
    );
  }

  /**
   * Tries to select a version of a required package.
   *
   * Returns the name of the package whose incompatibilities should be
   * propagated by `_propagate`, or `null` indicating that version solving is
   * complete and a solution has been found.
   *
   * @returns {Promise<string | null>}
   * @memberof VersionSolver
   */
  async _choosePackageVersion() {
    const unsatisfied = this._solution.unsatisfied;
    if (unsatisfied.length === 0) {
      return null;
    }

    /// Prefer packages with as few remaining versions as possible, so that if a
    /// conflict is necessary it's forced quickly.
    const $package = await minByAsync(unsatisfied, async $package => {
      return this._packageLister($package).countVersions($package.constraint);
    });

    let version;
    try {
      version = await this._packageLister($package).bestVersion(
        $package.constraint,
      );
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        this._addIncompatibility(
          new Incompatibility(
            [new Term($package.withConstraint(VersionConstraint.any), true)],
            new PackageNotFoundCause(error),
          ),
        );

        return $package.name;
      } else {
        throw error;
      }
    }

    if (version == null) {
      // If the constraint excludes only a single version, it must have come
      // from the inverse of a lockfile's dependency. In that case, we request
      // any version instead so that the lister gives us more general
      // incompatibilities. This makes error reporting much nicer.
      if (this._excludesSingleVersion($package.constraint)) {
        version = await this._packageLister($package).bestVersion(
          VersionConstraint.any,
        );
      } else {
        // If there are no versions that satisfy `package.constraint`, add an
        // incompatibility that indicates that.
        this._addIncompatibility(
          new Incompatibility(
            [new Term($package, true)],
            IncompatibilityCause.noVersions,
          ),
        );

        return $package.name;
      }
    }
    if (!version) {
      throw new Error("version is null or undefined.");
    }

    let conflict = false;
    const incompatibilities = await this._packageLister(
      $package,
    ).incompatibilitiesFor(version);
    for (const incompatibility of incompatibilities) {
      this._addIncompatibility(incompatibility);
      // If an incompatibility is already satisfied, then selecting `version`
      // would cause a conflict. We'll continue adding its dependencies, then go
      // back to unit propagation which will guide us to choose a better
      // version.
      conflict =
        conflict ||
        incompatibility.terms.every(
          term =>
            term.package.name == $package.name ||
            this._solution.satisfies(term),
        );
    }
    if (!conflict) {
      this._solution.decide(version);
      log(`selecting ${version.toString()}@${version.version.toString()}`);
    }

    return $package.name;
  }

  /**
   * Adds `incompatibility` to `_incompatibilities`.
   *
   * @param {import('./incompatibility').Incompatibility} incompatibility
   * @memberof VersionSolver
   */
  _addIncompatibility(incompatibility) {
    log(`fact: ${incompatibility}`);
    for (const term of incompatibility.terms) {
      if (!this._incompatibilities[term.package.name]) {
        this._incompatibilities[term.package.name] = [incompatibility];
      } else {
        this._incompatibilities[term.package.name].push(incompatibility);
      }
    }
  }

  /**
   * Returns whether `constraint` allows all versions except one.
   *
   * @param {import('./version').VersionConstraint} constraint
   * @returns {boolean}
   * @memberof VersionSolver
   */
  _excludesSingleVersion(constraint) {
    return VersionConstraint.any.difference(constraint) instanceof Version;
  }

  /**
   * Creates a `SolveResult` from the decisions in `_solution`.
   *
   * @returns {Promise<import('./solve-result').SolveResult>}
   * @memberof VersionSolver
   */
  async _result() {
    const decisions = this._solution.decisions;
    /**
     * @type {Object.<string, import('./manifest').Manifest>}
     */
    const manifests = {};
    for (const id of decisions) {
      if (id.isRoot()) {
        manifests[id.name] = this._root.manifest;
      } else {
        manifests[id.name] = await this._systemCache.hosted().describe(id);
      }
    }

    // let availableVersions = Map();
    // for (const id of decisions) {
    //   if (id.isRoot) {
    //     availableVersions = availableVersions.set(id.name, [id.version]);
    //   }
    // }
    return new SolveResult(
      decisions,
      manifests,
      this._getAvailableVersions(decisions),
      this._solution.attemptedSolutions,
    );
  }

  /**
   * Generates a map containing all of the known available versions for each
   * package in `packages`.
   *
   * The version list may not always be complete. If the package is the root
   * package, or if it's a package that we didn't unlock while solving because
   * we weren't trying to upgrade it, we will just know the current version.
   *
   * @param {Array<import('./package-name').PackageId>} packages
   * @returns {Object.<string, Array<import('./version').Version>>}
   * @memberof VersionSolver
   */
  _getAvailableVersions(packages) {
    /**
     * @type {Object.<string, Array<import('./version').Version>>}
     */
    const availableVersions = {};
    for (const $package of packages) {
      let cached = null;
      if (this._packageListers.has($package.toRef())) {
        const packageLister = this._packageListers.get($package.toRef());
        if (packageLister) {
          cached = packageLister.cachedVersions;
        }
      }
      // If the version list was never requested, just use the one known
      // version.
      const versions =
        cached == null ? [$package.version] : cached.map(id => id.version);
      availableVersions[$package.name] = versions;
    }

    return availableVersions;
  }

  /**
   * Returns the package lister for `package`, creating it if necessary.
   *
   * @param {import('./package-name').PackageName} $package
   * @returns {import('./package-lister').PackageLister}
   * @memberof VersionSolver
   */
  _packageLister($package) {
    const ref = $package.toRef();
    if (!this._packageListers.has(ref)) {
      this._packageListers = this._packageListers.set(
        ref,
        ref.isRoot()
          ? PackageLister.root(this._root)
          : new PackageLister(this._systemCache, ref, null),
      );
    }

    const packageLister = this._packageListers.get(ref);
    if (packageLister) {
      return packageLister;
    } else {
      throw new Error("packageLister is undefined.");
    }
  }
}
module.exports.VersionSolver = VersionSolver;
