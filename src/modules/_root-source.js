"use strict";

import assert from "assert";
import { BoundSource } from "./bound-source";
import { UnsupportedError } from "./errors";
import { PackageId } from "./package-name";

/**
 * A fake source that contains only the root package.
 *
 * This only implements the subset of the `BoundSource` API that
 * `PackageLister` uses to find information about packages.
 *
 * @class _RootSource
 * @extends {BoundSource}
 */
export class _RootSource extends BoundSource {
  /**
   * Creates an instance of _RootSource.
   * @param {import('./package').Package} _package
   * @memberof _RootSource
   */
  constructor(_package) {
    super();
    this._package = _package;
  }

  /**
   * An error to throw for unused source methods.
   *
   * @type {UnsupportedError}
   * @memberof _RootSource
   */
  get _unsupported() {
    return new UnsupportedError("_RootSource is not a full source.");
  }

  /**
   * @param {import('./package-name').PackageRef} ref
   * @returns {Promise<Array<import('./package-name').PackageId>>}
   * @memberof _RootSource
   */
  async getVersions(ref) {
    assert(ref.isRoot());

    return Promise.resolve([PackageId.root(this._package)]);
  }

  /**
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof _RootSource
   */
  async describe(id) {
    assert(id.isRoot());

    return Promise.resolve(this._package.manifest);
  }

  /**
   * @type {import('./source').Source}
   * @memberof _RootSource
   */
  get source() {
    throw this._unsupported;
  }

  /**
   * @type {import('./system-cache').SystemCache}
   * @memberof _RootSource
   */
  get systemCache() {
    throw this._unsupported;
  }

  /**
   * @returns {Promise<Array<import('./package-name').PackageId>>}
   * @memberof _RootSource
   */
  async doGetVersions(/*ref: PackageRef*/) {
    throw this._unsupported;
  }

  /**
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof _RootSource
   */
  async doDescribe(/*id: PackageId*/) {
    throw this._unsupported;
  }

  /**
   * @returns {Promise<void>}
   * @memberof _RootSource
   */
  async get(/*id: PackageId, symlink: string*/) {
    throw this._unsupported;
  }

  /**
   * @returns {string}
   * @memberof _RootSource
   */
  getDirectory(/*id: PackageId*/) {
    throw this._unsupported;
  }
}
