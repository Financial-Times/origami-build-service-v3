"use strict";

const { Manifest } = require("./Manifest");

/**
 * A named, versioned, unit of code and resource reuse.
 *
 * @class Package
 */
class Package {
  /**
   * Creates a package with `manifest` located at `dir`.
   * @param {import('./Manifest').Manifest} manifest
   * @param {string} dir
   * @memberof Package
   */
  constructor(manifest, dir) {
    this.manifest = manifest;
    this.dir = dir;
  }

  /**
   * Loads the package whose root directory is `packageDir`.
   *
   * `name` is the expected name of that package (e.g. the name given in the
   * dependency), or `null` if the package being loaded is the entrypoint
   * package.
   *
   * @static
   * @param {string} dir
   * @param {import('./SourceRegistry').SourceRegistry} sources
   * @returns {Package}
   * @memberof Package
   */
  static load(dir, sources) {
    const manifest = Manifest.load(dir, sources);

    return new this(manifest, dir);
  }

  /**
   * Compares `a` and `b` orders them by name then version number.
   *
   * This is normally used as a `Comparator` to pass to sort. This does not
   * take a package's description or root directory into account, so multiple
   * distinct packages may order the same.
   *
   * @static
   * @param {Package} a
   * @param {Package} b
   * @returns {number}
   * @memberof Package
   */
  static orderByNameAndVersion(a, b) {
    const name = a.name.localeCompare(b.name);
    if (name != 0) {
      return name;
    }

    return a.version.compareTo(b.version);
  }

  /**
   * The name of the package.
   *
   * @type {string}
   * @memberof Package
   */
  get name() {
    return this.manifest.name;
  }

  /**
   * The package's version.
   *
   * @type{import('./Version').Version}
   * @memberof Package
   */
  get version() {
    return this.manifest.version;
  }

  /**
   * @returns {string}
   * @memberof Package
   */
  toString() {
    return `${this.name} ${this.version} (${this.dir})`;
  }
}

module.exports.Package = Package;
