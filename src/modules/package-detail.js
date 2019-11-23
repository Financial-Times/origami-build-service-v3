"use strict";

/**
 * An enum of different levels of detail that can be used when displaying a terse package name.
 *
 * @class PackageDetail
 */
export class PackageDetail {
  /**
   * Creates an instance of PackageDetail.
   * @param {boolean} showVersion
   * @param {boolean} showSource
   * @param {boolean} [showDescription]
   * @memberof PackageDetail
   */
  constructor(showVersion, showSource, showDescription = false) {
    this.showSource = showDescription == true ? true : showSource;
    this.showDescription = showDescription;
    this.showVersion = showVersion;
  }

  /**
   * Returns a `PackageDetail` with the maximum amount of detail between `this` and `other`.
   *
   * @param {PackageDetail} [other]
   * @returns {PackageDetail}
   * @memberof PackageDetail
   */
  max(other) {
    if (other) {
      return new PackageDetail(
        this.showVersion || other.showVersion,
        this.showSource || other.showSource,
        this.showDescription || other.showDescription,
      );
    } else {
      return new PackageDetail(
        this.showVersion,
        this.showSource,
        this.showDescription,
      );
    }
  }
}

/**
 * The default `PackageDetail` configuration.
 * @type {PackageDetail}
 * @static
 * @memberof PackageDetail
 */
PackageDetail.defaults = new PackageDetail(false, false, false);
