"use strict";

import { promises as fs } from "fs";
import * as path from "path";
import { BoundSource } from "./bound-source";
import { Manifest } from "./manifest";
import * as directoryExists from "directory-exists";
import { debug as log } from "./log";

/**
 * Creates a new symlink that creates an alias at `symlink` that points to the
 * `target`.
 *
 * If `relative` is true, creates a symlink with a relative path from the
 * symlink to the target. Otherwise, uses the `target` path unmodified.
 *
 * @param {string} name
 * @param {string} target
 * @param {string} symlink
 */
const createPackageSymlink = async (name, target, symlink) => {
  log(`Creating link for package '${name}'. From ${symlink}, to ${target}.`);
  await fs.mkdir(path.parse(symlink).dir, { recursive: true });
  await fs.symlink(target, symlink);
};

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
export class CachedSource extends BoundSource {
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
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof CachedSource
   */
  async doDescribe(id) {
    if (await this.isInSystemCache(id)) {
      const packageDir = this.getDirectory(id);

      return Manifest.load(packageDir, this.systemCache.hostedSource);
    }

    return this.describeUncached(id);
  }

  /**
   * @param {import('./package-name').PackageId} id
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
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<boolean>}
   * @memberof CachedSource
   */
  async isInSystemCache(id) {
    return directoryExists(this.getDirectory(id));
  }

  /**
   * @abstract
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof CachedSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async describeUncached(id) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./package').Package>}
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
   * @returns {Promise<Array<import('./package').Package>>}
   * @memberof CachedSource
   */
  async getCachedPackages() {
    throw new Error("unimplemented");
  }
}
