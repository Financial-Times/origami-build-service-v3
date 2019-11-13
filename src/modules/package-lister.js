"use strict";

const assert = require("assert");
const { is } = require("immutable");
const { _RootSource } = require("./_root-source");
const { lowerBound, ordered } = require("./home");
const { PackageNotFoundError, ManifestError } = require("./errors");
const { Incompatibility } = require("./incompatibility");
const { IncompatibilityCause } = require("./incompatibility-cause");
const { PackageId } = require("./package-name");
const { PackageRef } = require("./package-name");
const { Manifest } = require("./manifest");
const { Term } = require("./term");
const { VersionConstraint } = require("./version");
const { VersionRange } = require("./version");
const log = require("./log");

/**
 * A cache of all the versions of a single package that provides information about those versions to the solver.
 *
 * @class PackageLister
 */
class PackageLister {
  /**
   * Creates a package lister for the dependency identified by `ref`.
   * @param {(import('./system-cache').SystemCache | null)} cache
   * @param {import('./package-name').PackageRef} _ref
   * @param {import('./package-name').PackageId | null} _locked
   * @param {import('./bound-source').BoundSource} [source]
   * @memberof PackageLister
   */
  constructor(cache, _ref, _locked, source) {
    /**
     * @type {Object.<string, VersionConstraint>}
     */
    this._alreadyListedDependencies = {};
    /**
     * @type {VersionConstraint}
     */
    this._knownInvalidVersions = VersionConstraint.empty;
    /**
     * @type {boolean}
     */
    this._listedLockedVersion = false;
    /**
     * @type {import('./package-name').PackageRef}
     */
    this._ref = _ref;
    /**
     * @type {import('./package-name').PackageId | null}
     */
    this._locked = _locked;
    /**
     * @type {import('./bound-source').BoundSource | undefined}
     */
    this._source = source ? source : cache ? cache.hosted() : undefined;
  }

  /**
   * Creates a package lister for the root `package`.
   *
   * @static
   * @param {import('./package').Package} $package
   * @returns {PackageLister}
   * @memberof PackageLister
   */
  static root($package) {
    const _ref = PackageRef.root($package);
    const _source = new _RootSource($package);
    // Treat the package as locked so we avoid the logic for finding the
    // boundaries of various constraints, which is useless for the root
    // package.
    const _locked = PackageId.root($package);

    return new PackageLister(null, _ref, _locked, _source);
  }

  /**
   * The versions of `_ref` that have been downloaded and cached, or `null` if they haven't been downloaded yet.
   *
   * @type {Array<import('./package-name').PackageId>}
   * @memberof PackageLister
   */
  get cachedVersions() {
    return this._cachedVersions || [];
  }

  /**
   * All versions of the package, sorted by `Version.compareTo`.
   *
   * @type {Promise<Array<import('./package-name').PackageId>>}
   * @memberof PackageLister
   */
  get _versions() {
    /**
     * @type {Promise<Array<import('./package-name').PackageId>>}
     * @private
     * @memberof PackageLister
     */
    this.versionsMemo = this.versionsMemo
      ? this.versionsMemo
      : (async () => {
          this._cachedVersions = this._source
            ? await this._source.getVersions(this._ref)
            : [];
          this._cachedVersions.sort((id1, id2) =>
            id1.version.compareTo(id2.version),
          );

          return this._cachedVersions;
        })();

    return this.versionsMemo;
  }

  /**
   * The most recent version of this package (or the oldest, if we're downgrading).
   *
   * @type {Promise<import('./package-name').PackageId | null>}
   * @readonly
   * @memberof PackageLister
   */
  get latest() {
    /**
     * @type {Promise<import('./package-name').PackageId | null>}
     * @private
     * @memberof PackageLister
     */
    this.latestMemo = this.latestMemo
      ? this.latestMemo
      : this.bestVersion(VersionConstraint.any);

    return this.latestMemo;
  }

  /**
   * Returns the number of versions of this package that match `constraint`.
   *
   * @param {VersionConstraint} constraint
   * @returns {Promise<number>}
   * @memberof PackageLister
   */
  async countVersions(constraint) {
    if (this._locked != null && constraint.allows(this._locked.version)) {
      return 1;
    }
    try {
      return (await this._versions).filter(id => constraint.allows(id.version))
        .length;
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        // If it fails for any reason, just treat that as no versions. This will
        // sort this reference higher so that we can traverse into it and report
        // the error in a user-friendly way.
        return 0;
      } else {
        throw error;
      }
    }
  }

  /**
   * Returns the best version of this package that matches `constraint`
   * according to the solver's prioritization scheme, or `null` if no versions
   * match.
   *
   * Throws a `PackageNotFoundError` if this lister's package doesn't
   * exist.
   *
   * @param {VersionConstraint} constraint
   * @returns {Promise<import('./package-name').PackageId | null>}
   * @throws {PackageNotFoundError}
   * @memberof PackageLister
   */
  async bestVersion(constraint) {
    if (this._locked != null && constraint.allows(this._locked.version)) {
      return this._locked;
    }
    const versions = await this._versions;
    // If `constraint` has a minimum, we can
    // bail early once we're past it.
    /**
     * @param {import("./version").Version} _
     */
    // eslint-disable-next-line no-unused-vars
    let isPastLimit = _ => false;
    if (constraint instanceof VersionRange) {
      const min = constraint.min;
      if (min != null) {
        isPastLimit = version => version.lessThan(min);
      }
    }
    // Return the most preferable version that matches `constraint`: the latest
    // non-prerelease version if one exists, or the latest prerelease version
    // otherwise.
    let version;
    const v = Array.from(versions);
    const _versions = v.reverse();
    for (const id of _versions) {
      if (isPastLimit != null && isPastLimit(id.version)) {
        break;
      }
      if (!constraint.allows(id.version)) {
        continue;
      }
      if (!id.version.isPreRelease()) {
        return id;
      }
      version = version != null ? version : id;
    }

    if (version) {
      return version;
    } else {
      return null;
    }
  }

  /**
   * Returns incompatibilities that encapsulate `id`'s dependencies, or that
   * indicate that it can't be safely selected.
   *
   * If multiple subsequent versions of this package have the same
   * dependencies, this will return incompatibilities that reflect that. It
   * won't return incompatibilities that have already been returned by a
   * previous call to `incompatibilitiesFor`.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<Array<Incompatibility>>}
   * @memberof PackageLister
   */
  async incompatibilitiesFor(id) {
    if (this._knownInvalidVersions.allows(id.version)) {
      return [];
    }

    let manifest;
    try {
      if (this._source) {
        manifest = await this._source.describe(id);
      } else {
        throw new Error("this._source is undefined.");
      }
    } catch (error) {
      if (error instanceof ManifestError) {
        // The lockfile for the manifest couldn't be parsed,
        log(`Failed to parse manifest for ${id}:\n${error}`);
        this._knownInvalidVersions = this._knownInvalidVersions.union(
          id.version,
        );

        return [
          new Incompatibility(
            [new Term(id.toRange(), true)],
            IncompatibilityCause.noVersions,
          ),
        ];
      } else if (error instanceof PackageNotFoundError) {
        // We can only get here if the lockfile refers to a specific package
        // version that doesn't exist (probably because it was yanked).
        this._knownInvalidVersions = this._knownInvalidVersions.union(
          id.version,
        );

        return [
          new Incompatibility(
            [new Term(id.toRange(), true)],
            IncompatibilityCause.noVersions,
          ),
        ];
      } else {
        throw error;
      }
    }

    if (
      this._cachedVersions == null &&
      this._locked != null &&
      is(id.version, this._locked.version)
    ) {
      if (this._listedLockedVersion) {
        return [];
      }

      const depender = id.toRange();
      this._listedLockedVersion = true;
      if (id.isRoot()) {
        const incompatibilities = [];
        for (const range of Object.values(manifest.dependencies)) {
          incompatibilities.push(this._dependency(depender, range));
        }

        return incompatibilities;
      } else {
        return Object.values(manifest.dependencies).map(range =>
          this._dependency(depender, range),
        );
      }
    }

    const versions = await this._versions;
    const index = lowerBound(versions, id, (id1, id2) =>
      id1.version.compareTo(id2.version),
    );
    assert(index < versions.length);
    assert(is(versions[index].version, id.version));
    // Don't recompute dependencies that have already been emitted.
    const dependencies = manifest.dependencies;
    for (const $package of Object.keys(dependencies)) {
      const constraint = this._alreadyListedDependencies[$package];
      if (constraint != null && constraint.allows(id.version)) {
        delete dependencies[$package];
      }
    }
    const lower = await this._dependencyBounds(dependencies, index, false);
    const upper = await this._dependencyBounds(dependencies, index, true);

    return ordered(Object.keys(dependencies)).map($package => {
      const constraint = new VersionRange(
        lower[$package],
        upper[$package],
        true,
        false,
        true,
      );
      this._alreadyListedDependencies[$package] = constraint.union(
        this._alreadyListedDependencies[$package]
          ? this._alreadyListedDependencies[$package]
          : VersionConstraint.empty,
      );

      return this._dependency(
        this._ref.withConstraint(constraint),
        dependencies[$package],
      );
    });
  }

  /**
   * Returns an `Incompatibility` that represents a dependency from `depender` onto `target`.
   *
   * @param {import('./package-name').PackageRange} depender
   * @param {import('./package-name').PackageRange} target
   * @returns {Incompatibility}
   * @memberof PackageLister
   */
  _dependency(depender, target) {
    return new Incompatibility(
      [new Term(depender, true), new Term(target, false)],
      IncompatibilityCause.dependency,
    );
  }

  /**
   * Returns a map where each key is a package name and each value is the upper
   * or lower (according to `upper`) bound of the range of versions with an
   * identical dependency to that in `dependencies`, around the version at
   * `index`.
   *
   * If a package is absent from the return value, that indicates indicate that
   * all versions above or below `index` (according to `upper`) have the same
   * dependency.
   *
   * @param {Object.<string, import('./package-name').PackageRange>} dependencies
   * @param {number} index
   * @param {boolean} upper
   * @returns {Promise<Object.<string, import('./version').Version>>}
   * @memberof PackageLister
   */
  async _dependencyBounds(dependencies, index, upper) {
    const versions = await this._versions;
    /**
     * @type {Object.<string, import('./version').Version>}
     */
    const bounds = {};
    let previous = versions[index];
    const v = Array.from(versions);
    for (const id of upper
      ? v.slice(index + 1)
      : v.reverse().slice(versions.length - index)) {
      const manifest = await this._describeSafe(id);
      // The upper bound is exclusive and so is the first package with a
      // different dependency. The lower bound is inclusive, and so is the last
      // package with the same dependency.
      const boundary = (upper ? id : previous).version;
      for (const range of Object.values(dependencies)) {
        if (bounds[range.name]) {
          continue;
        }
        if (manifest.dependencies[range.name] != range) {
          bounds[range.name] = boundary;
        }
      }
      if (Object.keys(bounds).length == Object.keys(dependencies).length) {
        break;
      }
      previous = id;
    }

    return bounds;
  }

  /**
   * Returns the manifest for `id`, or an empty pubpsec matching `id` if the
   * real manifest for `id` fails to load for any reason.
   *
   * This makes the bounds-finding logic resilient to broken manifests while
   * keeping the actual error handling in a central location.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof PackageLister
   */
  async _describeSafe(id) {
    try {
      if (this._source) {
        return await this._source.describe(id);
      } else {
        throw new Error("this._source is undefined.");
      }
    } catch (_) {
      return new Manifest(id.name, id.version);
    }
  }
}
module.exports.PackageLister = PackageLister;
