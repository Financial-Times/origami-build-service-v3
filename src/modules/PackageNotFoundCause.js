"use strict";

const { IncompatibilityCause } = require("./IncompatibilityCause");

/**
 * The incompatibility represents a package that couldn't be found by its source.
 *
 * @class PackageNotFoundCause
 */
class PackageNotFoundCause extends IncompatibilityCause {
  /**
   * Creates an instance of PackageNotFoundCause.
   *
   * @param {import("./HOME").PackageNotFoundException} exception
   * @memberof PackageNotFoundCause
   */
  constructor(exception) {
    super("Package not found");
    this.exception = exception;
  }
}
module.exports.PackageNotFoundCause = PackageNotFoundCause;
