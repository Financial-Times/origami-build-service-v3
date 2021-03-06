"use strict";

import { hash, is, Map } from "immutable";
import { BoundHostedSource } from "./bound-hosted-source";
import { ArgumentError, FormatError } from "./errors";
import * as url from "url";
import { PackageId, PackageRef } from "./package-name";
import { Source } from "./source";

const URL = url.URL;

/**
 * A package source that gets packages from a package hosting site that uses the same API as pub.dartlang.org.
 *
 * @class HostedSource
 * @extends {Source}
 */
export class HostedSource extends Source {
  /**
   * Creates an instance of HostedSource.
   * @memberof HostedSource
   */
  constructor() {
    super("hosted", true);
  }

  /**
   *
   *
   * @param {import('./system-cache').SystemCache} systemCache
   * @returns {BoundHostedSource}
   * @memberof HostedSource
   */
  bind(systemCache) {
    return new BoundHostedSource(this, systemCache);
  }

  /**
   * Returns a reference to a hosted package named `name`.
   *
   * If `url` is passed, it's the URL of the pub server from which the package
   *
   *
   * @param {string} name
   * @param {(string | import('url').URL)} [url]
   * @returns {import('./package-name').PackageRef}
   * @memberof HostedSource
   */
  refFor(name, url) {
    return new PackageRef(name, this, this._descriptionFor(name, url));
  }

  /**
   * Returns an ID for a hosted package named `name` at `version`.
   *
   * If `url` is passed, it's the URL of the pub server from which the package
   *
   * @param {string} name
   * @param {import('./version').Version} version
   * @param {(string | import('url').URL)} [url]
   * @returns {import('./package-name').PackageId}
   * @memberof HostedSource
   */
  idFor(name, version, url) {
    return new PackageId(name, this, version, this._descriptionFor(name, url));
  }

  /**
   * Returns the description for a hosted package named `name` with the
   *
   * @param {string} name
   * @param {(string | import('url').URL)} [url]
   * @returns {(string | import('immutable').Map<string, string>)}
   * @memberof HostedSource
   */
  _descriptionFor(name, url) {
    if (url == null) {
      return name;
    }
    if (typeof url !== "string" && !(url instanceof URL)) {
      throw new ArgumentError(`url, '${url}', must be a Uri or a String.`);
    }

    return Map({
      name,
      url: url.toString(),
    });
  }

  /**
   * @param {(string | import('immutable').Map<string, string>)} description
   * @returns {string}
   * @memberof HostedSource
   */
  formatDescription(description) {
    return `on ${this._parseDescription(description)}`;
  }

  /**
   * @param {(string | import('immutable').Map<string, string>)} description1
   * @param {(string | import('immutable').Map<string, string>)} description2
   * @returns {boolean}
   * @memberof HostedSource
   */
  descriptionsEqual(description1, description2) {
    return is(
      this._parseDescription(description1),
      this._parseDescription(description2),
    );
  }

  /**
   * @param {(string | import('immutable').Map<string, string>)} description
   * @returns {number}
   * @memberof HostedSource
   */
  hashDescription(description) {
    return hash(description);
  }

  /**
   * Ensures that `description` is a valid hosted package description.
   *
   * There are two valid formats. A plain string refers to a package with the
   * given name from the default host, while a map with keys "name" and "url"
   * refers to a package with the given name from the host at the given URL.
   *
   * @param {string} name
   * @param {(string | import('immutable').Map<string, string>)} description
   * @returns {import('./package-name').PackageRef}
   * @memberof HostedSource
   */
  parseRef(name, description) {
    this._parseDescription(description);

    return new PackageRef(name, this, description);
  }

  /**
   *
   *
   * @param {string} name
   * @param{import('./version').Version} version
   * @param {(string | import('immutable').Map<string, string>)} description
   * @returns {import('./package-name').PackageId}
   * @memberof HostedSource
   */
  parseId(name, version, description) {
    this._parseDescription(description);

    return new PackageId(name, this, version, description);
  }

  /**
   * Parses the description for a package.
   *
   * If the package parses correctly, this returns the name. If not,
   * this throws a descriptive FormatError.
   *
   * @param {(string | import('immutable').Map<string, string>)} description
   * @returns {string}
   * @memberof HostedSource
   */
  _parseDescription(description) {
    if (typeof description == "string") {
      return description;
    }
    if (!(description instanceof Map)) {
      throw new FormatError("The description must be a package name or map.");
    }
    if (!description.has("name")) {
      throw new FormatError("The description map must contain a 'name' key.");
    }
    const name = description.get("name");
    if (typeof name != "string") {
      throw new FormatError("The 'name' key must have a string value.");
    }

    return name;
  }
}
