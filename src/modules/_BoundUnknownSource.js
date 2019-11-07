"use strict";

const { BoundSource } = require("./BoundSource");
const { UnsupportedError } = require("./HOME");

/**
 *
 *
 * @class _BoundUnknownSource
 * @extends {BoundSource}
 */
class _BoundUnknownSource extends BoundSource {
  /**
   * Creates an instance of _BoundUnknownSource.
   * @param {import('./UnknownSource').UnknownSource} source
   * @param {import('./SystemCache').SystemCache} systemCache
   * @memberof _BoundUnknownSource
   */
  constructor(source, systemCache) {
    super();
    Object.defineProperty(this, "source", {
      value: source,
      writable: true,
    });
    Object.defineProperty(this, "systemCache", {
      value: systemCache,
      writable: true,
    });
  }

  /**
   * @param {import('./PackageName').PackageRef} ref
   * @returns {Promise<Array<import('./PackageName').PackageId>>}
   * @throws {UnsupportedError}
   * @memberof _BoundUnknownSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async doGetVersions(ref) {
    throw new UnsupportedError(
      `Cannot get package versions from unknown source '${this.source.name}'.`,
    );
  }

  /**
   *
   * @param {import('./PackageName').PackageId} id
   * @throws {UnsupportedError}
   * @returns {Promise<import('./Manifest').Manifest>}
   * @memberof _BoundUnknownSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  async doDescribe(id) {
    throw new UnsupportedError(
      `Cannot describe a package from unknown source '${this.source.name}'.`,
    );
  }

  /**
   *
   * @throws {UnsupportedError}
   * @memberof _BoundUnknownSource
   */
  async get(/*id: PackageId, symlink: string*/) {
    throw new UnsupportedError(
      `Cannot get an unknown source '${this.source.name}'.`,
    );
  }
  /**
   * Returns the directory where this package can be found locally.
   * @param {import('./PackageName').PackageId} id
   * @throws {UnsupportedError}
   * @returns {string}
   * @memberof _BoundUnknownSource
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  getDirectory(id) {
    throw new UnsupportedError(
      `Cannot find a package from an unknown source '${this.source.name}'.`,
    );
  }
}
module.exports._BoundUnknownSource = _BoundUnknownSource;
