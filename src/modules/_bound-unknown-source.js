"use strict";

const { BoundSource } = require("./bound-source");
const { UnsupportedError } = require("./home");

/**
 *
 *
 * @class _BoundUnknownSource
 * @extends {BoundSource}
 */
class _BoundUnknownSource extends BoundSource {
  /**
   * Creates an instance of _BoundUnknownSource.
   * @param {import('./unknown-source').UnknownSource} source
   * @param {import('./system-cache').SystemCache} systemCache
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
   * @param {import('./package-name').PackageRef} ref
   * @returns {Promise<Array<import('./package-name').PackageId>>}
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
   * @param {import('./package-name').PackageId} id
   * @throws {UnsupportedError}
   * @returns {Promise<import('./manifest').Manifest>}
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
   * @param {import('./package-name').PackageId} id
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
