"use strict";

const fs = require("fs");
const { fromJS, Map } = require("immutable");
const path = require("path");
const { FileException, ManifestException } = require("./home");
const { Version } = require("./version");
const { VersionConstraint } = require("./version");
const { VersionRange } = require("./version");
const fromEntries = require("object.fromentries");

/**
 * The parsed contents of a manifest file.
 *
 * The fields of a manifest are, for the most part, validated when they're first
 * accessed. This allows a partially-invalid manifest to be used if only the
 * valid portions are relevant. To get a list of all errors in the manifest, use
 * `allErrors`.
 *
 * @class Manifest
 */
class Manifest {
  /**
   * Creates an instance of Manifest.
   * @param {string} _name
   * @param {import('./version').Version=} version
   * @param {Array<import('./package-name').PackageRange>=} dependencies
   * @param {import('immutable').Map<any, any>=} fields
   * @param {import('./source-registry').SourceRegistry=} sources
   * @memberof Manifest
   */
  constructor(_name, version, dependencies, fields, sources) {
    this._version = version;
    /**
     * @type {Object.<string, import('./package-name').PackageRange>}
     */
    this._dependencies =
      dependencies == null
        ? null
        : fromEntries(dependencies.map(range => [range.name, range]));
    this.fields = fields == null ? Map() : Map(fields);
    this._sources = sources;
    this._name = _name;
  }

  /**
   * Loads the manifest for a package located in `packageDir`.
   *
   *
   * @static
   * @param {string} packageDir
   * @param {import('./source-registry').SourceRegistry} sources
   * @returns {Manifest}
   * @memberof Manifest
   */
  static load(packageDir, sources) {
    const manifestPath = path.join(packageDir, "package.json");
    if (!fs.existsSync(manifestPath)) {
      throw new FileException(
        `Could not find a file named "package.json" in "${packageDir}".`,
      );
    }

    return Manifest.parse(fs.readFileSync(manifestPath, "utf-8"), sources);
  }

  /**
   * Returns a Manifest object for an already-parsed map representing its
   * contents.
   *
   * If `expectedName` is passed and the manifest doesn't have a matching name
   * field, this will throw a `ManifestError`.
   *
   * `location` is the location from which this manifest was loaded.
   *
   * @static
   * @param {import('immutable').Map<any, any>} fields
   * @param {import('./source-registry').SourceRegistry} _sources
   * @param {string=} expectedName
   * @throws {import('./home').ManifestException}
   * @returns {Manifest}
   * @memberof Manifest
   */
  static fromMap(fields, _sources, expectedName) {
    // If `expectedName` is passed, ensure that the actual 'name' field exists
    // and matches the expectation.
    if (expectedName == null || fields.get("name") == expectedName) {
      return new this(
        fields.get("name"),
        undefined,
        undefined,
        fields,
        _sources,
      );
    }
    throw new ManifestException(
      `"name" field doesn't match expected name "${expectedName}".`,
    );
  }

  /**
   * Parses the manifest stored at `filePath` whose text is `contents`.
   *
   * If the manifest doesn't define a version for itself, it defaults to
   * `Version.none`.
   *
   * @static
   * @param {string} contents
   * @param {import('./source-registry').SourceRegistry} sources
   * @param {string=} expectedName
   * @returns {Manifest}
   * @throws {import('./home').ManifestException}
   * @memberof Manifest
   */
  static parse(contents, sources, expectedName) {
    let manifestNode;
    try {
      manifestNode = fromJS(JSON.parse(contents));
    } catch {
      throw new ManifestException(
        `The manifest must be a JSON object. The manifest was "${contents}".`,
      );
    }
    let manifestMap;
    if (manifestNode instanceof Map) {
      manifestMap = Map(manifestNode);
    } else {
      throw new ManifestException(
        `The manifest must be a JSON object. The manifest was "${contents}".`,
      );
    }

    return Manifest.fromMap(manifestMap, sources, expectedName);
  }

  /**
   * The package's name.
   *
   * @returns {string}
   * @throws {import('./home').ManifestException}
   * @readonly
   * @memberof Manifest
   */
  get name() {
    if (this._name != null) {
      return this._name;
    }
    const name = this.fields.get("name");
    if (name == null) {
      throw new ManifestException(
        `The manifest is missing the "name" field, which should be a string. The manifest was "${JSON.stringify(
          this.fields,
        )}".`,
      );
    } else if (typeof name != "string") {
      throw new ManifestException('"name" field must be a string.');
    }
    this._name = name;

    return this._name;
  }

  /**
   * The package's version.
   *
   * @returns {import('./version').Version}
   * @readonly
   * @memberof Manifest
   */
  get version() {
    if (this._version != null) {
      return this._version;
    }
    const version = this.fields.get("version");
    if (version == null) {
      this._version = Version.none;

      return this._version;
    }
    if (typeof version == "number") {
      let fixed = `${version}.0`;
      if (Math.trunc(version) === version) {
        fixed = `${fixed}.0`;
      }
      this._error(
        `"version" field must have three numeric components: major, minor, and patch. Instead of "${version}", consider "${fixed}".`,
      );
    }
    if (typeof version != "string") {
      this._error('"version" field must be a string.');
    }
    this._version = Version.parse(version);

    return this._version;
  }

  /**
   * The additional packages this package depends on.
   *
   * @returns {Object.<string, import('./package-name').PackageRange>}
   * @readonly
   * @memberof Manifest
   */
  get dependencies() {
    if (this._dependencies != null) {
      return this._dependencies;
    }
    this._dependencies = this._parseDependencies(
      "dependencies",
      this.fields.get("dependencies"),
    );

    return this._dependencies;
  }

  /**
   * Parses the dependency field named `field`, and returns the corresponding
   * map of dependency names to dependencies.
   *
   * @param {string} field
   * @param {import('immutable').Map<string, string>} node
   * @returns {Object.<string, import('./package-name').PackageRange>}
   * @memberof Manifest
   */
  _parseDependencies(field, node) {
    /**
     * @type {Object.<string, import('./package-name').PackageRange>}
     */
    const dependencies = {};
    // Allow an empty dependencies key.
    if (node == null) {
      return dependencies;
    }
    if (!(node instanceof Map)) {
      this._error(`"${field}" field must be a map.`);
    }
    const map = Map(node);
    const nonStringNode = map.findKey((_, key) => typeof key != "string");
    if (nonStringNode != null) {
      this._error("A dependency name must be a string.");
    }
    map.forEach((specNode, nameNode) => {
      const name = nameNode;
      let spec = specNode;
      if (this.fields.get("name") != null && name == this.name) {
        this._error("A package may not list itself as a dependency.");
      }
      let descriptionNode;
      let sourceName;
      /**
       * @type {VersionConstraint}
       */
      let versionConstraint = new VersionRange();
      if (spec == null) {
        if (this._sources) {
          descriptionNode = nameNode;
          sourceName = this._sources.defaultSource.name;
        }
      } else if (typeof spec == "string") {
        if (this._sources) {
          descriptionNode = nameNode;
          sourceName = this._sources.defaultSource.name;
          versionConstraint = this._parseVersionConstraint(spec);
        }
      } else if (spec instanceof Map) {
        spec = Map(spec);
        const specMap = spec;
        if (spec.has("version")) {
          spec = spec.remove("version");
          versionConstraint = this._parseVersionConstraint(
            specMap.get("version"),
          );
        }
        const sourceNames = spec.keySeq().toList();
        if (sourceNames.size > 1) {
          this._error("A dependency may only have one source.");
        } else if (sourceNames.isEmpty()) {
          // Default to a hosted dependency if no source is specified.
          sourceName = "hosted";
          descriptionNode = nameNode;
        }
        sourceName = sourceName != null ? sourceName : sourceNames.first();
        if (typeof sourceName != "string") {
          this._error("A source name must be a string.");
        }
        descriptionNode =
          descriptionNode != null ? descriptionNode : specMap.get(sourceName);
      } else {
        this._error(
          "A dependency specification must be a string or a mapping.",
        );
      }
      if (this._sources) {
        // Let the source validate the description.
        const ref = this._sources
          .get(sourceName)
          .parseRef(name, descriptionNode == null ? null : descriptionNode);
        dependencies[name] = ref.withConstraint(versionConstraint);
      }
    });

    return dependencies;
  }

  /**
   * Parses `node` to a `VersionConstraint`.
   *
   * If or `defaultUpperBoundConstraint` is specified then it will be set as
   * the max constraint if the original constraint doesn't have an upper
   * bound and it is compatible with `defaultUpperBoundConstraint`.
   *
   * @param {string} version
   * @param {import('./version').VersionConstraint=} defaultUpperBoundConstraint
   * @returns {import('./version').VersionConstraint}
   * @memberof Manifest
   */
  _parseVersionConstraint(version, defaultUpperBoundConstraint) {
    if (version == null) {
      return defaultUpperBoundConstraint != null
        ? defaultUpperBoundConstraint
        : VersionConstraint.any;
    }
    if (typeof version != "string") {
      this._error("A version constraint must be a string.");
    }
    if (version.includes("git.svc.ft.com:9080/git/origami/")) {
      version = version.replace(
        /https?:\/\/git\.svc\.ft\.com:9080\/git\/origami\/.*\.git#/,
        "",
      );
    }
    if (version.includes("github.com/Financial-Times/")) {
      version = version.replace(
        /https?:\/\/github\.com\/Financial-Times\/.*\.git#/,
        "",
      );
    }
    let constraint = VersionConstraint.parse(version);
    if (
      defaultUpperBoundConstraint != null &&
      constraint instanceof VersionRange &&
      constraint.max == null &&
      defaultUpperBoundConstraint.allowsAny(constraint)
    ) {
      constraint = VersionConstraint.intersection([
        constraint,
        defaultUpperBoundConstraint,
      ]);
    }

    return constraint;
  }

  /**
   * Throws a `ManifestException` with the given message.
   * @throws {import('./home').ManifestException}
   * @param {string} message
   * @memberof Manifest
   */
  _error(message) {
    throw new ManifestException(message);
  }
}
module.exports.Manifest = Manifest;
