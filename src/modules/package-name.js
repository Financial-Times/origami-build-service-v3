"use strict";

const { hash, is } = require("immutable");
// const { HostedSource } = require("./hosted-source");
const { PackageDetail } = require("./package-detail");
const { Version } = require("./version");
const { VersionConstraint } = require("./version");
const { VersionRange } = require("./version");

/**
 * The base class of `PackageRef`, `PackageId`, and `PackageRange`.
 *
 * @class PackageName
 */
class PackageName {
  /**
   * Creates an instance of PackageName.
   * @param {string} name
   * @param {import('./source').Source | null} source
   * @param {*} description
   * @param {boolean} isMagic
   * @memberof PackageName
   */
  constructor(name, source, description, isMagic) {
    this.name = name;
    this.source = source;
    this.description = description;
    this.isMagic = isMagic;
  }

  /**
   * @static
   * @param {string} name
   * @param {import('./source').Source | null} source
   * @param {*} description
   * @returns {PackageName}
   * @memberof PackageName
   */
  static _(name, source, description) {
    return new this(name, source, description, false);
  }

  /**
   *
   *
   * @static
   * @param {string} name
   * @returns {PackageName}
   * @memberof PackageName
   */
  static _magic(name) {
    return new this(name, null, null, true);
  }

  /**
   * Whether this package is the root package.
   *
   * @type {boolean}
   * @memberof PackageName
   */
  get isRoot() {
    return this.source == null && !this.isMagic;
  }

  /**
   * Returns a `PackageRef` with this one's `name`, `source`, and `description`.
   *
   * @returns {PackageRef}
   * @memberof PackageName
   */
  toRef() {
    return this.isMagic
      ? PackageRef.magic(this.name)
      : new PackageRef(this.name, this.source, this.description);
  }

  /**
   * Returns a `PackageRange` for this package with the given version constraint.
   *
   * @param {VersionConstraint} constraint
   * @returns {PackageRange}
   * @memberof PackageName
   */
  withConstraint(constraint) {
    return new PackageRange(
      this.name,
      this.source,
      constraint,
      this.description,
    );
  }

  /**
   * Returns whether this refers to the same package as `other`.
   *
   * This doesn't compare any constraint information; it's equivalent to
   * `this.toRef() == other.toRef()`.
   *
   * @param {PackageName} other
   * @returns {boolean}
   * @memberof PackageName
   */
  samePackage(other) {
    if (other.name != this.name) {
      return false;
    }
    if (this.source == null) {
      return other.source == null;
    }

    return (
      other.source == this.source &&
      this.source.descriptionsEqual(this.description, other.description)
    );
  }

  /**
   * @returns {number}
   * @memberof PackageName
   */
  hashCode() {
    if (this.source == null) {
      return hash(this.name);
    }

    return (
      hash(this.name) ^
      hash(this.source) ^
      this.source.hashDescription(this.description)
    );
  }

  /**
   * Returns a string representation of this package name.
   *
   * If `detail` is passed, it controls exactly which details are included.
   *
   * @returns {string}
   * @throws {Error}
   * @memberof PackageName
   */
  toString(/*detail?: PackageDetail*/) {
    throw new Error(
      "Unimplmented method, please implemenet `toString` method on the class which extends PackageName",
    );
  }
}

/**
 * A reference to a specific version of a package.
 *
 * A package ID contains enough information to correctly get the package.
 *
 * It's possible for multiple distinct package IDs to point to different
 * packages that have identical contents. For example, the same package may be
 * available from multiple sources. As far as Pub is concerned, those packages
 * are different.
 *
 * Note that a package ID's `description` field has a different structure than
 * the `PackageRef.description` or `PackageRange.description` fields for some
 * sources. For example, the `git` source adds revision information to the
 * description to ensure that the same ID always points to the same source.
 *
 *
 * @class PackageId
 * @extends {PackageName}
 */
class PackageId extends PackageName {
  /**
   * Creates an instance of PackageId.
   * Creates an ID for a package with the given `name`, `source`, `version`,
   * and `description`.
   *
   * Since an ID's description is an implementation detail of its source, this
   * should generally not be called outside of `Source` subclasses.
   * @param {string} name
   * @param {import('./source').Source | null} source
   * @param{import('./version').Version} version
   * @param {*} description
   * @param {boolean} [isMagic]
   * @memberof PackageId
   */
  constructor(name, source, version, description, isMagic = false) {
    super(name, source, description, isMagic);
    this.version = version;
  }

  /**
   * Creates an ID for a magic package (see `isMagic`).
   *
   * @static
   * @param {string} name
   * @returns {PackageId}
   * @memberof PackageId
   */
  static magic(name) {
    return new this(name, null, Version.none, null, true);
  }

  /**
   * Creates an ID for the given root package.
   *
   * @static
   * @param {import('./package').Package} $package
   * @returns {PackageId}
   * @memberof PackageId
   */
  static root($package) {
    return new this($package.name, null, $package.version, $package.name);
  }

  /**
   * @returns {number}
   * @memberof PackageId
   */
  hashCode() {
    return super.hashCode() ^ hash(this.version);
  }

  /**
   * @param {*} other
   * @returns {boolean}
   * @memberof PackageId
   */
  equals(other) {
    return (
      other instanceof PackageId &&
      this.samePackage(other) &&
      is(other.version, this.version)
    );
  }

  /**
   * Returns a `PackageRange` that allows only `version` of this package.
   *
   * @returns {PackageRange}
   * @memberof PackageId
   */
  toRange() {
    return this.withConstraint(this.version);
  }

  /**
   * @param {PackageDetail} [detail]
   * @returns {string}
   * @memberof PackageId
   */
  toString(detail) {
    detail = detail ? detail : PackageDetail.defaults;
    if (this.isMagic) {
      return this.name;
    }
    let buffer = this.name;
    if (detail.showVersion != null ? detail.showVersion : !this.isRoot) {
      buffer += ` ${this.version}`;
    }

    // if (
    //   !this.isRoot &&
    //   (detail.showSource != null
    //     ? detail.showSource
    //     : !(this.source instanceof HostedSource))
    // ) {
    //   buffer += ` from ${this.source}`;
    //   if (detail.showDescription) {
    //     buffer += ` ${this.source.formatDescription(this.description)}`;
    //   }
    // }
    return buffer;
  }
}

/**
 * A reference to a constrained range of versions of one package.
 *
 * @class PackageRange
 * @extends {PackageName}
 */
class PackageRange extends PackageName {
  /**
   * Creates an instance of PackageRange.
   * Creates a reference to package with the given `name`, `source`,
   * `constraint`, and `description`.
   *
   * Since an ID's description is an implementation detail of its source, this
   * should generally not be called outside of `Source` subclasses.
   * @param {string} name
   * @param {import('./source').Source | null} source
   * @param {VersionConstraint} constraint
   * @param {*} description
   * @param {boolean} [isMagic]
   * @memberof PackageRange
   */
  constructor(name, source, constraint, description, isMagic = false) {
    super(name, source, description, isMagic);
    this.constraint = constraint;
  }

  /**
   * @static
   * @param {string} name
   * @returns {PackageRange}
   * @memberof PackageRange
   */
  static magic(name) {
    return new this(name, null, Version.none, null, true);
  }

  /**
   * Creates a range that selects the root package.
   *
   * @static
   * @param {import('./package').Package} $package
   * @returns {PackageRange}
   * @memberof PackageRange
   */
  static root($package) {
    return new this($package.name, null, $package.version, $package.name);
  }

  /**
   * @param {PackageDetail} [detail]
   * @returns {string}
   * @memberof PackageRange
   */
  toString(detail) {
    detail = detail ? detail : PackageDetail.defaults;
    if (this.isMagic) {
      return this.name;
    }
    let buffer = this.name;
    if (
      detail.showVersion != null
        ? detail.showVersion
        : this._showVersionConstraint
    ) {
      buffer += ` ${this.constraint}`;
    }

    // if (
    //   !this.isRoot &&
    //   (detail.showSource != null
    //     ? detail.showSource
    //     : !(this.source instanceof HostedSource))
    // ) {
    //   buffer += ` from ${this.source}`;
    //   if (detail.showDescription) {
    //     buffer += ` ${this.source.formatDescription(this.description)}`;
    //   }
    // }
    return buffer;
  }

  /**
   * Whether to include the version constraint in `toString` by default.
   * @type {boolean}
   * @memberof PackageRange
   */
  get _showVersionConstraint() {
    if (this.isRoot) {
      return false;
    }
    if (!this.constraint.isAny) {
      return true;
    }

    return true;
  }

  /**
   * Returns a copy of `this` with the same semantics, but with a `^`-style constraint if possible.
   *
   * @returns {PackageRange}
   * @memberof PackageRange
   */
  withTerseConstraint() {
    if (!(this.constraint instanceof VersionRange)) {
      return this;
    }
    if (this.constraint.toString().startsWith("^")) {
      return this;
    }
    const range = this.constraint;
    if (!range.includeMin) {
      return this;
    }
    if (range.includeMax) {
      return this;
    }
    if (range.min == null) {
      return this;
    }
    if (
      is(range.max, range.min.nextBreaking.firstPreRelease) ||
      (range.min.isPreRelease && is(range.max, range.min.nextBreaking))
    ) {
      return this.withConstraint(VersionConstraint.compatibleWith(range.min));
    } else {
      return this;
    }
  }

  /**
   * Whether `id` satisfies this dependency.
   *
   * Specifically, whether `id` refers to the same package as `this` *and*
   * `constraint` allows `id.version`.
   *
   *
   * @param {PackageId} id
   * @returns {boolean}
   * @memberof PackageRange
   */
  allows(id) {
    return this.samePackage(id) && this.constraint.allows(id.version);
  }

  /**
   * @returns {number}
   * @memberof PackageRange
   */
  hashCode() {
    return super.hashCode() ^ hash(this.constraint);
  }

  /**
   * @param {*} other
   * @returns {boolean}
   * @memberof PackageRange
   */
  equals(other) {
    return (
      other instanceof PackageRange &&
      this.samePackage(other) &&
      is(other.constraint, this.constraint)
    );
  }
}

/**
 * A reference to a `Package`, but not any particular version(s) of it.
 *
 * @class PackageRef
 * @extends {PackageName}
 */
class PackageRef extends PackageName {
  /**
   * Creates a reference to the given root package.
   *
   * @static
   * @param {import('./package').Package} $package
   * @returns {PackageRef}
   * @memberof PackageRef
   */
  static root($package) {
    return new this($package.name, null, $package.name);
  }
  /**
   * Creates a reference to a magic package (see `isMagic`).
   *
   * @static
   * @param {string} name
   * @returns {PackageRef}
   * @memberof PackageRef
   */
  static magic(name) {
    return new this(name, null, null, true);
  }
  /**
   * Creates an instance of PackageRef.
   * Creates a reference to a package with the given `name`, `source`, and
   * `description`.
   *
   * Since an ID's description is an implementation detail of its source, this
   * should generally not be called outside of `Source` subclasses. A reference
   * can be obtained from a user-supplied description using `Source.parseRef`.
   *
   * @param {string} name
   * @param {import('./source').Source | null} source
   * @param {*} description
   * @param {boolean} [isMagic]
   * @memberof PackageRef
   */
  constructor(name, source, description, isMagic = false) {
    super(name, source, description, isMagic);
  }

  /**
   * @returns {string}
   * @memberof PackageRef
   */
  toString(/*detail*/) {
    // detail = detail ? detail : PackageDetail.defaults;
    if (this.isMagic || this.isRoot) {
      return this.name;
    }
    const buffer = this.name;

    // if (
    //   detail.showSource != null
    //     ? detail.showSource
    //     : !(this.source instanceof HostedSource)
    // ) {
    //   buffer += ` from ${this.source}`;
    //   if (detail.showDescription) {
    //     buffer += ` ${this.source.formatDescription(this.description)}`;
    //   }
    // }
    return buffer;
  }

  /**
   * @param {*} other
   * @returns {boolean}
   * @memberof PackageRef
   */
  equals(other) {
    return other instanceof PackageRef && this.samePackage(other);
  }
}

module.exports.PackageName = PackageName;
module.exports.PackageId = PackageId;
module.exports.PackageRange = PackageRange;
module.exports.PackageRef = PackageRef;
