"use strict";

import { Set } from "immutable";

/**
 * The result of a successful version resolution.
 *
 * @class SolveResult
 */
export class SolveResult {
  /**
   * Creates an instance of SolveResult.
   * @param {Array<import('./package-name').PackageId>} packages
   * @param {Object.<string, import('./manifest').Manifest>} manifests
   * @param {Object.<string, Array<import('./version').Version>>} availableVersions
   * @param {number} attemptedSolutions
   * @memberof SolveResult
   */
  constructor(packages, manifests, availableVersions, attemptedSolutions) {
    this.packages = packages;
    this.manifests = manifests;
    this.availableVersions = availableVersions;
    this.attemptedSolutions = attemptedSolutions;
  }

  /**
   * Returns the names of all packages that were changed.
   *
   * This includes packages that were added or removed.
   *
   * @type {import('immutable').Set<string> | null}
   * @readonly
   * @memberof SolveResult
   */
  get changedPackages() {
    if (this.packages == null) {
      return null;
    }
    const changed = Set(this.packages.map(id => id.name));

    return changed;
  }

  /**
   * @returns {string}
   * @memberof SolveResult
   */
  toString() {
    return `Took ${
      this.attemptedSolutions
    } tries to resolve to\n- ${this.packages.join("\n- ")}`;
  }
}
