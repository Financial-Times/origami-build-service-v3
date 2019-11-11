"use strict";

const { Map } = require("immutable");
const { ArgumentError, PackageNotFoundException } = require("./home");

/**
 * A source bound to a `SystemCache`.
 *
 * @class BoundSource
 */
class BoundSource {
  constructor() {
    /**
     * @type {import('immutable').Map<import('./package-name').PackageId, import('./manifest').Manifest>}
     */
    this._manifests = Map();
  }

  /**
   * Get the IDs of all versions that match `ref`.
   *
   * Note that this does *not* require the packages to be downloaded locally,
   * which is the point. This is used during version resolution to determine
   * which package versions are available to be downloaded (or already
   * downloaded).
   *
   * By default, this assumes that each description has a single version and
   * uses `describe` to get that version.
   *
   * Sources should not override this. Instead, they implement `doGetVersions`.
   *
   * @param {import('./package-name').PackageRef} ref
   * @returns {Promise<Array<import('./package-name').PackageId>>}
   * @memberof BoundSource
   */
  async getVersions(ref) {
    if (ref.isRoot) {
      throw new ArgumentError("Cannot get versions for the root package.");
    }
    if (ref.source !== this.source) {
      throw new ArgumentError(
        `Package ${ref} does not use source ${this.source.name}.`,
      );
    }

    return this.doGetVersions(ref);
  }

  /**
   * Loads the (possibly remote) pubspec for the package version identified by
   * `id`.
   *
   * This may be called for packages that have not yet been downloaded during
   * the version resolution process. Its results are automatically memoized.
   *
   * Throws a `DataException` if the pubspec's version doesn't match `id`'s
   * version.
   *
   * Sources should not override this. Instead, they implement `doDescribe`.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof BoundSource
   */
  async describe(id) {
    if (id.isRoot) {
      throw new ArgumentError("Cannot describe the root package.");
    }
    if (id.source !== this.source) {
      throw new ArgumentError(
        `Package ${id} does not use source ${this.source.name}.`,
      );
    }
    let pubspec = this._manifests.get(id);
    if (pubspec != null) {
      return pubspec;
    }
    // Delegate to the overridden one.
    pubspec = await this.doDescribe(id);
    if (pubspec.version !== id.version) {
      throw new PackageNotFoundException(
        `the pubspec for ${id} has version ${pubspec.version}`,
      );
    }
    this._manifests = this._manifests.set(id, pubspec);

    return pubspec;
  }

  /**
   * Stores `pubspec` so it's returned when `describe` is called with `id`.
   *
   * This is notionally protected; it should only be called by subclasses.
   *
   * @param {import('./package-name').PackageId} id
   * @param {import('./manifest').Manifest} pubspec
   * @memberof BoundSource
   */
  memoizeManifest(id, pubspec) {
    this._manifests = this._manifests.set(id, pubspec);
  }

  /**
   * @abstract
   * @type {import('./source').Source}
   * @memberof BoundSource
   */
  get source() {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @type {import('./system-cache').SystemCache}
   * @memberof BoundSource
   */
  get systemCache() {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {import('./package-name').PackageRef} ref
   * @returns {Promise<Array<import('./package-name').PackageId>>}
   * @memberof BoundSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async doGetVersions(ref) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof BoundSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async doDescribe(id) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {import('./package-name').PackageId} id
   * @param {string} symlink
   * @returns {Promise<void>}
   * @memberof BoundSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async get(id, symlink) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {import('./package-name').PackageId} id
   * @returns {string}
   * @memberof BoundSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  getDirectory(id) {
    throw new Error("unimplemented");
  }
}

module.exports.BoundSource = BoundSource;
