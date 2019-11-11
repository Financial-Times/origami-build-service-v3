"use strict";

const assert = require("assert");
const { Map, Set } = require("immutable");
const { Assignment } = require("./assignment");
const { StateError } = require("./home");
const { SetRelation } = require("./set-relation");
/**
 * A list of `Assignment`s that represent the solver's current best guess about
 * what's true for the eventual set of package versions that will comprise the
 * total solution.
 *
 * See https://github.com/dart-lang/pub/tree/master/doc/solver.md#partial-solution.
 *
 * @class PartialSolution
 */
class PartialSolution {
  /**
   * Creates an instance of PartialSolution.
   * @memberof PartialSolution
   */
  constructor() {
    this._attemptedSolutions = 1;
    this._backtracking = false;
    /**
     * @type {Array<import('./assignment').Assignment>}
     */
    this._assignments = [];
    /**
     * @type {Object.<string, import('./package-name').PackageId>}
     */
    this._decisions = {};
    /**
     * @type {Object.<string, import('./term').Term>}
     */
    this._positive = {};
    /**
     * @type {Object.<string, import('immutable').Map<import('./package-name').PackageRef, import('./term').Term>>}
     */
    this._negative = {};
  }

  /**
   * Returns all the decisions that have been made in this partial solution.
   * @type {Array<import('./package-name').PackageId>}
   * @memberof PartialSolution
   */
  get decisions() {
    return Object.values(this._decisions);
  }

  /**
   * Returns all `PackageRange`s that have been assigned but are not yet satisfied.
   *
   * @type {Array<import('./package-name').PackageRange>}
   * @memberof PartialSolution
   */
  get unsatisfied() {
    return Object.values(this._positive)
      .filter(term => !this._decisions[term.package.name])
      .map(term => term.package);
  }

  /**
   * The current decision level—that is, the length of `decisions`.
   *
   * @type {number}
   * @memberof PartialSolution
   */
  get decisionLevel() {
    return Object.keys(this._decisions).length;
  }

  /**
   * The number of distinct solutions that have been attempted so far.
   *
   * @type {number}
   * @memberof PartialSolution
   */
  get attemptedSolutions() {
    return this._attemptedSolutions;
  }

  /**
   * Adds an assignment of `package` as a decision and increments the `decisionLevel`.
   *
   * @param {import('./package-name').PackageId} $package
   * @memberof PartialSolution
   */
  decide($package) {
    // When we make a new decision after backtracking, count an additional
    // attempted solution. If we backtrack multiple times in a row, though, we
    // only want to count one, since we haven't actually started attempting a
    // new solution.
    if (this._backtracking) {
      this._attemptedSolutions++;
    }
    this._backtracking = false;
    this._decisions[$package.name] = $package;
    this._assign(
      Assignment.decision(
        $package,
        this.decisionLevel,
        this._assignments.length,
      ),
    );
  }

  /**
   * Adds an assignment of `package` as a derivation.
   *
   * @param {import('./package-name').PackageRange} $package
   * @param {boolean} isPositive
   * @param {import('./incompatibility').Incompatibility} cause
   * @memberof PartialSolution
   */
  derive($package, isPositive, cause) {
    this._assign(
      Assignment.derivation(
        $package,
        isPositive,
        cause,
        this.decisionLevel,
        this._assignments.length,
      ),
    );
  }

  /**
   * Adds `assignment` to `_assignments` and `_positive` or `_negative`.
   *
   * @param {import('./assignment').Assignment} assignment
   * @memberof PartialSolution
   */
  _assign(assignment) {
    this._assignments.push(assignment);
    this._register(assignment);
  }

  /**
   * Resets the current decision level to `decisionLevel`, and removes all assignments made after that level.
   *
   * @param {number} decisionLevel
   * @memberof PartialSolution
   */
  backtrack(decisionLevel) {
    this._backtracking = true;
    let packages = Set();
    while (
      this._assignments[this._assignments.length - 1].decisionLevel >
      decisionLevel
    ) {
      const removed = this._assignments.pop();
      if (!removed) {
        throw new Error("removed in undefined.");
      }
      packages = packages.add(removed.package.name);
      if (removed.isDecision) {
        delete this._decisions[removed.package.name];
      }
    }
    // Re-compute `_positive` and `_negative` for the packages that were removed.
    for (const $package of packages) {
      delete this._positive[$package];
      delete this._negative[$package];
    }
    for (const assignment of this._assignments) {
      if (packages.contains(assignment.package.name)) {
        this._register(assignment);
      }
    }
  }

  /**
   * Registers `assignment` in `_positive` or `_negative`.
   *
   * @param {import('./assignment').Assignment} assignment
   * @memberof PartialSolution
   */
  _register(assignment) {
    const name = assignment.package.name;
    const oldPositive = this._positive[name];
    if (oldPositive != null) {
      const term = oldPositive.intersect(assignment);
      if (term) {
        this._positive[name] = term;

        return;
      } else {
        throw new Error("term is null.");
      }
    }
    const ref = assignment.package.toRef();
    const negativeByRef = this._negative[name];
    const oldNegative = negativeByRef == null ? null : negativeByRef.get(ref);
    const term =
      oldNegative == null ? assignment : assignment.intersect(oldNegative);
    if (term && term.isPositive) {
      delete this._negative[name];
      this._positive[name] = term;
    } else {
      if (!this._negative[name] && term) {
        this._negative[name] = Map([[ref, term]]);
      }
    }
  }

  /**
   * Returns the first `Assignment` in this solution such that the sublist of
   * assignments up to and including that entry collectively satisfies `term`.
   *
   * Throws a `StateError` if `term` isn't satisfied by `this`.
   *
   * @param {import('./term').Term} term
   * @returns {import('./assignment').Assignment}
   * @memberof PartialSolution
   */
  satisfier(term) {
    let assignedTerm;
    for (const assignment of this._assignments) {
      if (assignment.package.name != term.package.name) {
        continue;
      }
      if (
        !assignment.package.isRoot &&
        !assignment.package.samePackage(term.package)
      ) {
        // not foo from hosted has no bearing on foo from git
        if (!assignment.isPositive) {
          continue;
        }
        // foo from hosted satisfies not foo from git
        assert(!term.isPositive);

        return assignment;
      }
      assignedTerm =
        // @ts-ignore: Object is possibly 'undefined'
        assignedTerm == null ? assignment : assignedTerm.intersect(assignment);
      // As soon as we have enough assignments to satisfy `term`, return them.
      if (assignedTerm && assignedTerm.satisfies(term)) {
        return assignment;
      }
    }
    throw new StateError(`[BUG] ${term} is not satisfied.`);
  }

  /**
   * Returns whether `this` satisfies `other`.
   *
   * That is, whether `other` must be true given the assignments in this
   * partial solution.
   *
   * @param {import('./term').Term} term
   * @returns {boolean}
   * @memberof PartialSolution
   */
  satisfies(term) {
    return this.relation(term) == SetRelation.subset;
  }

  /**
   * Returns the relationship between the package versions allowed by all assignments in `this` and those allowed by `term`.
   *
   * @param {import('./term').Term} term
   * @returns {import('./set-relation').SetRelation}
   * @memberof PartialSolution
   */
  relation(term) {
    const positive = this._positive[term.package.name];
    if (positive != null) {
      return positive.relation(term);
    }
    // If there are no assignments related to `term`, that means the
    // assignments allow any version of any package, which is a superset of
    // `term`.
    const byRef = this._negative[term.package.name];
    if (byRef == null) {
      return SetRelation.overlapping;
    }
    // not foo from git is a superset of foo from hosted
    // not foo from git overlaps not foo from hosted
    const negative = byRef.get(term.package.toRef());
    if (negative == null) {
      return SetRelation.overlapping;
    }

    return negative.relation(term);
  }
}
module.exports.PartialSolution = PartialSolution;
