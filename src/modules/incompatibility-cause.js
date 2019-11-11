"use strict";

/**
 * The reason an `Incompatibility`'s terms are incompatible.
 *
 * @class IncompatibilityCause
 */
class IncompatibilityCause {
  /**
   * Creates an instance of IncompatibilityCause.
   * @param {string} _name
   * @memberof IncompatibilityCause
   */
  constructor(_name) {
    this._name = _name;
  }

  /**
   * @returns {string}
   * @memberof IncompatibilityCause
   */
  toString() {
    return this._name;
  }
}

/**
 * The incompatibility represents the requirement that the root package exists.
 * @type {IncompatibilityCause}
 * @static
 * @memberof IncompatibilityCause
 */
IncompatibilityCause.root = new IncompatibilityCause("root");

/**
 * The incompatibility represents a package's dependency.
 * @type {IncompatibilityCause}
 * @static
 * @memberof IncompatibilityCause
 */
IncompatibilityCause.dependency = new IncompatibilityCause("dependency");

/**
 * The incompatibility indicates that the package has no versions that match the given constraint.
 * @type {IncompatibilityCause}
 * @static
 * @memberof IncompatibilityCause
 */
IncompatibilityCause.noVersions = new IncompatibilityCause("no versions");

/**
 * The incompatibility indicates that the package has an unknown source.
 * @type {IncompatibilityCause}
 * @static
 * @memberof IncompatibilityCause
 */
IncompatibilityCause.unknownSource = new IncompatibilityCause("unknown source");

module.exports.IncompatibilityCause = IncompatibilityCause;
