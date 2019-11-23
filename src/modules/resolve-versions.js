"use strict";

import { VersionSolver } from "./version-solver";

/**
 * Attempts to select the best concrete versions for all of the transitive
 * dependencies of `root` taking into account all of the `VersionConstraint`s
 * that those dependencies place on each other.
 *
 * @param {import('./system-cache').SystemCache} cache
 * @param {import('./package').Package} root
 * @returns {Promise<import('./solve-result').SolveResult>}
 */
export async function resolveVersions(cache, root) {
  return new VersionSolver(cache, root).solve();
}
