"use strict";

import { IncompatibilityCause } from "./incompatibility-cause";

/**
 * The incompatibility represents a package that couldn't be found by its source.
 *
 * @class PackageNotFoundCause
 */
export class PackageNotFoundCause extends IncompatibilityCause {
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
