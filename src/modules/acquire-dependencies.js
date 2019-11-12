"use strict";

const { ArgumentError } = require("./home");
const { Package } = require("./package");
const { resolveVersions } = require("./resolveVersions");
const path = require("path");

/**
 * Finds a set of dependencies that match the `rootDir` package's constraints
 * and then installs/links the packages into the `node_modules` within `rootDir`.
 * throws an error if it is not possible to create a flat dependency tree based on `rootDir`
 * package's constraints.
 *
 * @param {string} rootDir Absolute path to the folder of the project who dependencies should be installed
 * @param {import("./system-cache").SystemCache} cache
 * @throws {ArgumentError}
 * @returns {Promise<void>}
 */
async function acquireDependencies(rootDir, cache) {
  if (!path.isAbsolute(rootDir)) {
    throw new ArgumentError(
      `rootDir needs to be an absolute path. rootDir is "${rootDir}".`,
    );
  }
  const rootPackage = Package.load(rootDir, cache.hostedSource);
  const result = await resolveVersions(cache, rootPackage);
  await Promise.all(result.packages.map(id => _get(rootDir, cache, id)));
}

/**
 * Makes sure the package at `id` is locally available.
 *
 * This automatically downloads the package to the system-wide cache as well
 * if it requires network access to retrieve (specifically, if the package's
 * source is a `CachedSource`).
 *
 * @param {string} rootDir
 * @param {import("./system-cache").SystemCache} cache
 * @param {import("./package-name").PackageId} id
 * @returns {Promise<void>}
 */
async function _get(rootDir, cache, id) {
  if (!id.isRoot()) {
    const source = cache.hosted();
    await source.get(id, path.join(rootDir, "node_modules", id.name));
  }
}

module.exports.acquireDependencies = acquireDependencies;
