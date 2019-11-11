"use strict";

const { StateError } = require("./home");
const { HostedSource } = require("./hosted-source");
const { UnknownSource } = require("./unknown-source");

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
  get defaultSource() {
    return this._default;
  }

  /**
   * The registered sources, in name order.
   *
   * @returns {Array<import('./source').Source>}
   * @readonly
   * @memberof SourceRegistry
   */
  get all() {
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
   * Sets the default source.
   * This takes a string, which must be the name of a registered source.
   *
   * @param {string} name
   * @memberof SourceRegistry
   */
  setDefault(name) {
    if (!this._sources.name) {
      throw new StateError(`Default source ${name} is not in the registry`);
    }
    this._default = this._sources.name;
  }

  /**
   * Registers a new source.
   *
   * This source may not have the same name as a source that's already been
   * registered.
   *
   * @param {import('./source').Source} source
   * @memberof SourceRegistry
   */
  register(source) {
    if (this._sources[source.name]) {
      throw new StateError(
        `Source registry already has a source named ${source.name}`,
      );
    }
    this._sources[source.name] = source;
  }

  /**
   * Returns the source named `name`.
   *
   * Returns an `UnknownSource` if no source with that name has been
   * registered. If `name` is null, returns the default source.
   *
   * @param {string} name
   * @returns {import('./source').Source}
   * @memberof SourceRegistry
   */
  get(name) {
    if (name == null) {
      return this._default;
    }
    if (this._sources[name]) {
      return this._sources[name];
    }

    return new UnknownSource(name);
  }
}
module.exports.SourceRegistry = SourceRegistry;
