"use strict";

const { VersionSolver } = require("./VersionSolver");

/**
 * Attempts to select the best concrete versions for all of the transitive
 * dependencies of `root` taking into account all of the `VersionConstraint`s
 * that those dependencies place on each other.
 *
 * @param {symbol} type
 * @param {import('./SystemCache').SystemCache} cache
 * @param {import('./Package').Package} root
 * @returns {Promise<import('./SolveResult').SolveResult>}
 */
async function resolveVersions(type, cache, root) {
  return new VersionSolver(type, cache, root).solve();
}

module.exports.resolveVersions = resolveVersions;
