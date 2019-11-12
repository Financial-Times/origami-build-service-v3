"use strict";

const { HostedSource } = require("./hosted-source");

/**
 * A class that keeps track of `Source`s used for getting packages.
 */
class SourceRegistry {
  constructor() {
    /**
     * @type {Object}
     * @property {import('./hosted-source').HostedSource} hosted
     */
    this._sources = {
      hosted: new HostedSource(),
    };

    /**
     * @type {import('./source').Source}
     */
    this._default = this.hosted;
  }

  /**
   * The default source, which is used when no source is specified.
   *
   * This defaults to `hosted`.
   * @returns {import('./source').Source}
   * @readonly
   * @memberof SourceRegistry
   */
  defaultSource() {
    return this._default;
  }

  /**
   * The registered sources, in name order.
   *
   * @returns {Array<import('./source').Source>}
   * @readonly
   * @memberof SourceRegistry
   */
  all() {
    const sources = Object.values(this._sources);
    sources.sort((a, b) => a.name.localeCompare(b.name));

    return sources;
  }

  /**
   * The built-in `HostedSource`.
   * @returns {import('./hosted-source').HostedSource}
   * @readonly
   * @memberof SourceRegistry
   */
  get hosted() {
    return this._sources.hosted;
  }

  /**
   * Returns the source named `name`.
   *
   * If `name` is null, returns the default source.
   *
   * @param {string} name
   * @returns {import('./source').Source}
   * @memberof SourceRegistry
   */
  get(name) {
    return this._sources[name];
  }
}
module.exports.SourceRegistry = SourceRegistry;
