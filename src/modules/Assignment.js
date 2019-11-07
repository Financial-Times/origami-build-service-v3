"use strict";

const { Term } = require("./Term");
/**
 * A term in a `PartialSolution` that tracks some additional metadata.
 *
 * @class Assignment
 * @extends {Term}
 */
class Assignment extends Term {
  /**
   * Creates an instance of Assignment.
   *
   * @param {import('./PackageName').PackageRange} $package
   * @param {boolean} isPositive
   * @param {number} decisionLevel
   * @param {number} index
   * @param {import('./Incompatibility').Incompatibility | null} cause
   * @memberof Assignment
   */
  constructor($package, isPositive, decisionLevel, index, cause) {
    super($package, isPositive);
    this.decisionLevel = decisionLevel;
    this.index = index;
    this.cause = cause;
  }

  /**
   * Creates a decision: a speculative assignment of a single package version.
   *
   * @static
   * @param {import('./PackageName').PackageId} $package
   * @param {number} decisionLevel
   * @param {number} index
   * @returns {Assignment}
   * @memberof Assignment
   */
  static decision($package, decisionLevel, index) {
    return new Assignment($package.toRange(), true, decisionLevel, index, null);
  }

  /**
   * Creates a derivation: an assignment that's automatically propagated from incompatibilities.
   *
   * @static
   * @param {import('./PackageName').PackageRange} $package
   * @param {boolean} isPositive
   * @param {import('./Incompatibility').Incompatibility} cause
   * @param {number} decisionLevel
   * @param {number} index
   * @returns {Assignment}
   * @memberof Assignment
   */
  static derivation($package, isPositive, cause, decisionLevel, index) {
    return new this($package, isPositive, decisionLevel, index, cause);
  }

  /**
   * Whether this assignment is a decision, as opposed to a derivation.
   *
   * @returns {boolean}
   * @readonly
   * @memberof Assignment
   */
  get isDecision() {
    return this.cause == null;
  }
}
module.exports.Assignment = Assignment;
