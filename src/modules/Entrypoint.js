"use strict";

const { CachedSource } = require("./CachedSource");
const { Package } = require("./Package");
const { resolveVersions } = require("./resolveVersions");
const { GET } = require("./SolveType");
const path = require("path");

/**
 * The context surrounding the root package pub is operating on.
 *
 * Pub operates over a directed graph of dependencies that starts at a root
 * "entrypoint" package. This is typically the package where the current
 * working directory is located. An entrypoint knows the `root` package it is
 * associated with and is responsible for managing the "packages" directory
 * for it.
 *
 * That directory contains symlinks to all packages used by an app. These links
 * point either to the `SystemCache` or to some other location on the local
 * filesystem.
 *
 * While entrypoints are typically applications, a pure library package may end
 * up being used as an entrypoint. Also, a single package may be used as an
 * entrypoint in one context but not in another. For example, a package that
 * contains a reusable library may not be the entrypoint when used by an app,
 * but may be the entrypoint when you're running its tests.
 * @class Entrypoint
 */
class Entrypoint {
  /**
   * Creates an instance of Entrypoint.
   * Loads the entrypoint from a package at `rootDir`.
   *
   * @param {string} rootDir
   * @param {import("./SystemCache").SystemCache} cache
   * @memberof Entrypoint
   */
  constructor(rootDir, cache) {
    this.rootDir = rootDir;
    this.cache = cache;
    this.root = Package.load(rootDir, cache.sources);
  }

  /**
   * Gets all dependencies of the `root` package.
   * Performs version resolution according to `SolveType`.
   *
   * @param {import("./SolveType").GET|import("./SolveType").DOWNGRADE} type
   * @memberof Entrypoint
   * @returns {Promise<void>}
   */
  async acquireDependencies(type = GET) {
    const result = await resolveVersions(type, this.cache, this.root);
    const stopwatch = process.hrtime();
    console.log("packages", result.packages.map(p => p.name).join(" "));
    await Promise.all(result.packages.map(id => this._get(id)));
    console.log(
      `Installing dependencies took ${process.hrtime(stopwatch)} seconds.`,
    );
  }
  /**
   * Makes sure the package at `id` is locally available.
   *
   * This automatically downloads the package to the system-wide cache as well
   * if it requires network access to retrieve (specifically, if the package's
   * source is a `CachedSource`).
   *
   * @param {import("./PackageName").PackageId} id
   * @returns {Promise<void>}
   * @memberof Entrypoint
   */
  async _get(id) {
    if (id.isRoot) {
      return;
    }
    const source = id.source ? this.cache.source(id.source) : null;
    if (source instanceof CachedSource) {
      await source.get(id, path.join(this.rootDir, "node_modules", id.name));
    }
  }
}

module.exports.Entrypoint = Entrypoint;
