"use strict";

const fs = require("fs");
const path = require("path");
const { BoundSource } = require("./BoundSource");
const { createPackageSymlink, dirExists } = require("./HOME");
const { Manifest } = require("./Manifest");

/**
 * Base class for a `BoundSource` that installs packages into pub's
 * `SystemCache`.
 *
 * A source should be cached if it requires network access to retrieve
 * packages or the package needs to be "frozen" at the point in time that it's
 * installed. (For example, Git packages are cached because installing from
 * the same repo over time may yield different commits.)
 *
 * @class CachedSource
 * @extends {BoundSource}
 */
class CachedSource extends BoundSource {
  /**
   * The root directory of this source's cache within the system cache.
   *
   * @type {string}
   * @memberof CachedSource
   */
  get systemCacheRoot() {
    return path.join(this.systemCache.rootDir, this.source.name);
  }

  /**
   * If `id` is already in the system cache, just loads it from there.
   *
   * Otherwise, defers to the subclass.
   *
   * @param {import('./PackageName').PackageId} id
   * @returns {Promise<import('./Manifest').Manifest>}
   * @memberof CachedSource
   */
  async doDescribe(id) {
    const packageDir = this.getDirectory(id);
    if (fs.existsSync(path.join(packageDir, "package.json"))) {
      return Manifest.load(packageDir, this.systemCache.sources);
    }

    return this.describeUncached(id);
  }

  /**
   * @param {import('./PackageName').PackageId} id
   * @param {string} symlink
   * @returns {Promise<void>}
   * @memberof CachedSource
   */
  async get(id, symlink) {
    const pkg = await this.downloadToSystemCache(id);
    await createPackageSymlink(id.name, pkg.dir, symlink);
  }

  /**
   * Determines if the package identified by `id` is already downloaded to the system cache.
   *
   * @param {import('./PackageName').PackageId} id
   * @returns {Promise<boolean>}
   * @memberof CachedSource
   */
  async isInSystemCache(id) {
    return dirExists(this.getDirectory(id));
  }

  /**
   * @abstract
   * @param {import('./PackageName').PackageId} id
   * @returns {Promise<import('./Manifest').Manifest>}
   * @memberof CachedSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async describeUncached(id) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {import('./PackageName').PackageId} id
   * @returns {Promise<import('./Package').Package>}
   * @memberof CachedSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async downloadToSystemCache(id) {
    throw new Error("unimplemented");
  }

  /**
   *
   *
   * @abstract
   * @returns {Promise<Array<import('./Package').Package>>}
   * @memberof CachedSource
   */
  async getCachedPackages() {
    throw new Error("unimplemented");
  }
}

module.exports.CachedSource = CachedSource;
