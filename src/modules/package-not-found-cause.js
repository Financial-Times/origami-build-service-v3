"use strict";

const { IncompatibilityCause } = require("./incompatibility-cause");

/**
 * The incompatibility represents a package that couldn't be found by its source.
 *
 * @class PackageNotFoundCause
 */
class PackageNotFoundCause extends IncompatibilityCause {
  /**
   * Creates an instance of PackageNotFoundCause.
   *
   * @param {import("./errors").PackageNotFoundError} error
   * @memberof PackageNotFoundCause
   */
  constructor(error) {
    super("Package not found");
    this.error = error;
  }
}
module.exports.PackageNotFoundCause = PackageNotFoundCause;
