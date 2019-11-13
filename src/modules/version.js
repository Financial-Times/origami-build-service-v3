"use strict";

/* eslint-disable no-unused-vars */
const assert = require("assert");
const { hash, is, List } = require("immutable");
const { equalsWithoutPreRelease } = require("./home");
const { ArgumentError, FormatError } = require("./errors");
const semver = require("semver");

/**
 * returns 1 if a is bigger than b.
 * return -1 is a is smaller than b
 * returns 0 if a is the same as b.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const compareNumbers = (a, b) => (a > b ? 1 : a < b ? -1 : 0);

/**
 * Returns whether `range1` allows only versions lower than those allowed by `range2`.
 * @param {import('./version').VersionRange} range1
 * @param {import('./version').VersionRange} range2
 * @returns {boolean}
 */
const strictlyLower = (range1, range2) => {
  if (range1.max == null || range2.min == null) {
    return false;
  }
  const comparison = range1.max.compareTo(range2.min);
  if (comparison == -1) {
    return true;
  }
  if (comparison == 1) {
    return false;
  }

  return !range1.includeMax || !range2.includeMin;
};

/**
 * Returns whether `range1` allows only versions higher than those allowed by `range2`.
 * @param {import('./version').VersionRange} range1
 * @param {import('./version').VersionRange} range2
 * @returns {boolean}
 */
const strictlyHigher = (range1, range2) => strictlyLower(range2, range1);

/**
 * Returns whether `range1` allows lower versions than `range2`.
 * @param {import('./version').VersionRange} range1
 * @param {import('./version').VersionRange} range2
 * @returns {boolean}
 */
const allowsLower = (range1, range2) => {
  if (range1.min == null) {
    return range2.min != null;
  }
  if (range2.min == null) {
    return false;
  }
  const comparison = range1.min.compareTo(range2.min);
  if (comparison === -1) {
    return true;
  }
  if (comparison === 1) {
    return false;
  }

  return range1.includeMin && !range2.includeMin;
};

/**
 * Returns whether `range1` allows higher versions than `range2`.
 * @param {import('./version').VersionRange} range1
 * @param {import('./version').VersionRange} range2
 * @returns {boolean}
 */
const allowsHigher = (range1, range2) => {
  if (range1.max == null) {
    return range2.max != null;
  }
  if (range2.max == null) {
    return false;
  }
  const comparison = range1.max.compareTo(range2.max);
  if (comparison == 1) {
    return true;
  }
  if (comparison == -1) {
    return false;
  }

  return range1.includeMax && !range2.includeMax;
};

/**
 * Returns whether `range1` is immediately next to, but not overlapping, `range2`.
 * @param {import('./version').VersionRange} range1
 * @param {import('./version').VersionRange} range2
 * @returns {boolean}
 */
const areAdjacent = (range1, range2) => {
  if (!is(range1.max, range2.min)) {
    return false;
  }

  return (
    (range1.includeMax && !range2.includeMin) ||
    (!range1.includeMax && range2.includeMin)
  );
};

/**
 *  Regex that matches a version number at the beginning of a string.
 * @type {RegExp}
 */
const START_VERSION = new RegExp(
  /^/.source + // Start at beginning.
  /(\d+).(\d+).(\d+)/.source + // Version number.
  /(-([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?/.source + // Pre-release.
    /(\+([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?/.source, // Build.
);

/**
 * Like `START_VERSION` but matches the entire string.
 * @type {RegExp}
 */
const COMPLETE_VERSION = new RegExp(START_VERSION.source + /$/.source);

/**
 * Parses a comparison operator ("<", ">", "<=", or ">=") at the beginning of a string.
 * @type {RegExp}
 */
const START_COMPARISON = /^[<>]=?/;

/**
 * The "compatible with" operator.
 * @type {string}
 */
const COMPATIBLE_WITH = "^";

/**
 * A `VersionConstraint` is a predicate that can determine whether a given
 * version is valid or not.
 *
 * For example, a ">= 2.0.0" constraint allows any version that is "2.0.0" or
 * greater. Version objects themselves implement this to match a specific
 * version.
 *
 * @interface
 * @class VersionConstraint
 */
class VersionConstraint {
  /**
   * Parses a version constraint.
   *
   * This string is one of:
   *
   *   * "*". `*` version.
   *   * "^" followed by a version string. Versions compatible with
   *     (`VersionConstraint.compatibleWith`) the version.
   *   * a series of version parts. Each part can be one of:
   *     * A version string like `1.2.3`. In other words, anything that can be
   *       parsed by `Version.parse()`.
   *     * A comparison operator (`<`, `>`, `<=`, or `>=`) followed by a
   *       version string.
   *
   * Whitespace is ignored.
   *
   * Examples:
   *
   *     *
   *     ^0.7.2
   *     ^1.0.0-alpha
   *     1.2.3-alpha
   *     <=5.1.4
   *     >2.0.4 <= 2.4.6
   *
   * @static
   * @param {string} text
   * @returns {VersionConstraint}
   * @memberof VersionConstraint
   */
  static parse(text) {
    const originalText = text;
    function skipWhitespace() {
      text = text.trim();
    }
    skipWhitespace();
    // Handle the "*" constraint.
    if (text == "*") {
      return VersionConstraint.any;
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    function isSemVerVersion(text) {
      text = text.trim();
      if (/^v?(\d+).(\d+).(\d+)/.test(text)) {
        return semver.coerce(text, { loose: true }).version;
      } else if (/^v?(\d+).(\d+)/.test(text)) {
        return semver.coerce(text + ".0", { loose: true }).version;
      } else if (/^v?(\d+)/.test(text)) {
        return semver.coerce(text + ".0" + ".0", { loose: true }).version;
      } else {
        return "";
      }
    }

    // Try to parse and consume a version number.
    function matchVersion() {
      const a = isSemVerVersion(text);

      const version = START_VERSION.exec(a);
      if (version == null || version[1] == null) {
        return null;
      }
      const v = version[0];
      text = text.substring(text.indexOf(v) + v.length);

      return Version.parse(v);
    }

    // Try to parse and consume a comparison operator followed by a version.
    function matchComparison() {
      if (!semver.validRange(text, { loose: true })) {
        return null;
      }
      const a = semver.validRange(text, { loose: true });
      const comparison = START_COMPARISON.exec(a);
      if (comparison == null || comparison[0] == null) {
        return null;
      }

      const op = comparison[0];
      text = text.substring(text.indexOf(op) + op.length);
      skipWhitespace();

      const version = matchVersion();
      if (version == null) {
        throw new Error(
          `Expected version number after "${op}" in "${originalText}", got "${text}".`,
        );
      }

      switch (op) {
        case "<=":
          return new VersionRange(undefined, version, undefined, true);
        case "<":
          return new VersionRange(undefined, version, undefined, false, true);
        case ">=":
          return new VersionRange(version, undefined, true);
        case ">":
          return new VersionRange(version, undefined, false);
        default:
          throw new Error("Unreachable.");
      }
    }

    // Try to parse the "^" operator followed by a version.
    function matchCompatibleWith() {
      if (!text.startsWith(COMPATIBLE_WITH)) {
        return null;
      }

      text = text.substring(COMPATIBLE_WITH.length);
      skipWhitespace();

      const version = matchVersion();
      if (version == null) {
        throw new Error(
          `Expected version number after "${COMPATIBLE_WITH}" in "${originalText}", got "${text}".`,
        );
      }

      if (text.length != 0) {
        throw new Error(
          `Cannot include other constraints with "${COMPATIBLE_WITH}" constraint in "${originalText}".`,
        );
      }

      return VersionConstraint.compatibleWith(version);
    }
    const compatibleWith = matchCompatibleWith();
    if (compatibleWith != null) {
      return compatibleWith;
    }
    let min;
    let includeMin = false;
    let max;
    let includeMax = false;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      skipWhitespace();
      if (text.length == 0) {
        break;
      }
      const version = matchVersion();
      const newRange = version != null ? version : matchComparison();
      if (newRange == null) {
        throw new FormatError(
          `Could not parse version "${originalText}". Unknown text at "${text}".`,
        );
      }
      if (newRange.min != null) {
        if (min == null || newRange.min.greaterThan(min)) {
          min = newRange.min;
          includeMin = newRange.includeMin;
        } else if (is(newRange.min, min) && !newRange.includeMin) {
          includeMin = false;
        }
      }
      if (newRange.max != null) {
        if (max == null || newRange.max.lessThan(max)) {
          max = newRange.max;
          includeMax = newRange.includeMax;
        } else if (is(newRange.max, max) && !newRange.includeMax) {
          includeMax = false;
        }
      }
    }
    if (min == null && max == null) {
      throw new FormatError("Cannot parse an empty string.");
    }
    if (min != null && max != null) {
      if (min.greaterThan(max)) {
        return VersionConstraint.empty;
      }
      if (is(min, max)) {
        if (includeMin && includeMax) {
          return min;
        }

        return VersionConstraint.empty;
      }
    }

    return new VersionRange(min, max, includeMin, includeMax);
  }

  /**
   * Creates a version constraint which allows all versions that are
   * backward compatible with `version`.
   *
   * Versions are considered backward compatible with `version` if they
   * are greater than or equal to `version`, but less than the next breaking
   * version (`Version.nextBreaking()`) of `version`.
   *
   * @static
   * @param {Version} version
   * @returns {CompatibleWithVersionRange}
   * @memberof VersionConstraint
   */
  static compatibleWith(version) {
    return new CompatibleWithVersionRange(version);
  }

  /**
   * Creates a new version constraint that is the intersection of
   * `constraints`.
   *
   * It only allows versions that all of those constraints allow. If
   * constraints is empty, then it returns a VersionConstraint that allows
   * all versions.
   *
   * @static
   * @param {Iterable<VersionConstraint>} constraints
   * @returns {VersionConstraint}
   * @memberof VersionConstraint
   */
  static intersection(constraints) {
    let constraint;
    for (const other of constraints) {
      if (constraint) {
        constraint = constraint.intersect(other);
      } else {
        constraint = new VersionRange().intersect(other);
      }
    }

    if (constraint) {
      return constraint;
    } else {
      throw new Error("constraint is undefined.");
    }
  }

  /**
   * Creates a new version constraint that is the union of `constraints`.
   *
   * It allows any versions that any of those constraints allows. If
   * `constraints` is empty, this returns a constraint that allows no versions.
   *
   * @static
   * @param {import('immutable').List<VersionConstraint | VersionUnion>} constraints
   * @returns {VersionConstraint}
   * @memberof VersionConstraint
   */
  static unionOf(constraints) {
    const flattened = constraints.flatMap(constraint => {
      if (constraint.isEmpty()) {
        return List([]);
      }
      if (constraint instanceof VersionUnion) {
        return constraint.ranges;
      }

      return List([constraint]);
    });
    if (flattened.isEmpty()) {
      return VersionConstraint.empty;
    }
    if (flattened.some(constraint => constraint.isAny())) {
      return VersionConstraint.any;
    }
    // Only allow Versions and VersionRanges here so we can more easily reason
    // about everything in `flattened`. _EmptyVersions and VersionUnions are
    // filtered out above.
    const ranges = [];
    for (const constraint of flattened) {
      if (constraint instanceof VersionRange) {
        ranges.push(constraint);
      } else {
        throw new ArgumentError(
          `Unknown VersionConstraint type ${constraint}.`,
        );
      }
    }
    ranges.sort();
    let merged = List();
    for (const constraint of ranges) {
      // Merge this constraint with the previous one, but only if they touch.
      if (
        merged.isEmpty() ||
        (!merged.last().allowsAny(constraint) &&
          !areAdjacent(merged.last(), constraint))
      ) {
        merged = merged.push(constraint);
      } else {
        merged = merged.set(merged.size - 1, merged.last().union(constraint));
      }
    }
    if (merged.size == 1) {
      return merged.first();
    }

    return VersionUnion.fromRanges(merged);
  }

  /**
   * Returns `true` if this constraint allows no versions.
   *
   * @returns {boolean}
   * @abstract
   * @readonly
   * @memberof VersionConstraint
   */
  isEmpty() {
    throw new Error("unimplemented");
  }

  /**
   * Returns `true` if this constraint allows all versions.
   *
   * @returns {boolean}
   * @abstract
   * @readonly
   * @memberof VersionConstraint
   */
  isAny() {
    throw new Error("unimplemented");
  }

  /**
   * Returns `true` if this constraint allows [version].
   *
   * @param {Version} other
   * @returns {boolean}
   * @abstract
   * @memberof VersionConstraint
   */
  // @ts-ignore
  allows(other) {
    throw new Error("unimplemented");
  }

  /**
   * Returns `true` if this constraint allows all the versions that [other]
   * allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @abstract
   * @memberof VersionConstraint
   */
  // @ts-ignore
  allowsAll(other) {
    throw new Error("unimplemented");
  }

  /**
   * Returns `true` if this constraint allows any of the versions that [other]
   * allows.
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @abstract
   * @memberof VersionConstraint
   */
  // @ts-ignore
  allowsAny(other) {
    throw new Error("unimplemented");
  }

  /**
   * Returns a [VersionConstraint] that only allows [Version]s allowed by both
   * this and [other].
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @abstract
   * @memberof VersionConstraint
   */
  // @ts-ignore
  intersect(other) {
    throw new Error("unimplemented");
  }

  /**
   * Returns a [VersionConstraint] that allows [Versions]s allowed by either
   * this or [other].
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @abstract
   * @memberof VersionConstraint
   */
  // @ts-ignore
  union(other) {
    throw new Error("unimplemented");
  }

  /**
   * Returns a [VersionConstraint] that allows [Version]s allowed by this but
   * not [other].
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @abstract
   * @memberof VersionConstraint
   */
  // @ts-ignore
  difference(other) {
    throw new Error("unimplemented");
  }
}

/**
 *
 * @implements {VersionConstraint}
 * @class _EmptyVersion
 */
class _EmptyVersion extends VersionConstraint {
  /**
   * Returns `true` if this constraint allows no versions.
   *
   * @readonly
   * @returns {boolean}
   * @memberof _EmptyVersion
   */
  isEmpty() {
    return true;
  }

  /**
   * Returns `true` if this constraint allows all versions.
   *
   * @returns {boolean}
   * @readonly
   * @memberof _EmptyVersion
   */
  isAny() {
    return false;
  }

  /**
   * Returns `true` if this constraint allows [version].
   *
   * @returns {boolean}
   * @memberof _EmptyVersion
   */
  allows(/*other: Version*/) {
    return false;
  }

  /**
   * Returns `true` if this constraint allows all the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof _EmptyVersion
   */
  allowsAll(other) {
    return other.isEmpty();
  }

  /**
   * Returns `true` if this constraint allows any of the versions that [other] allows.
   *
   * @returns {boolean}
   * @memberof _EmptyVersion
   */
  allowsAny(/*other: VersionConstraint*/) {
    return false;
  }

  /**
   * Returns a [VersionConstraint] that only allows [Version]s allowed by both this and [other].
   *
   * @returns {this}
   * @memberof _EmptyVersion
   */
  intersect(/*other: VersionConstraint*/) {
    return this;
  }

  /**
   * Returns a [VersionConstraint] that allows [Versions]s allowed by either this or [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof _EmptyVersion
   */
  union(other) {
    return other;
  }

  /**
   * Returns a [VersionConstraint] that allows [Version]s allowed by this but not [other].
   *
   * @returns {this}
   * @memberof _EmptyVersion
   */
  difference(/*other: VersionConstraint*/) {
    return this;
  }

  /**
   * Returns string representation of the _EmptyVersion instance.
   *
   * @returns {string}
   * @memberof _EmptyVersion
   */
  toString() {
    return "<empty>";
  }
}

/**
 * Constrains versions to a fall within a given range.
 *
 * If there is a minimum, then this only allows versions that are at that
 * minimum or greater. If there is a maximum, then only versions less than
 * that are allowed. In other words, this allows `>= min, < max`.
 *
 * Version ranges are ordered first by their lower bounds, then by their upper
 * bounds. For example, `>=1.0.0 <2.0.0` is before `>=1.5.0 <2.0.0` is before
 * `>=1.5.0 <3.0.0`.
 *
 * @implements {VersionConstraint}
 * @class VersionRange
 */
class VersionRange extends VersionConstraint {
  /**
   * Creates a new version range from `min` to `max`, either inclusive or
   * exclusive.
   *
   * If it is an error if `min` is greater than `max`.
   *
   * Either `max` or `min` may be omitted to not clamp the range at that end.
   * If both are omitted, the range allows all versions.
   *
   * If `includeMin` is `true`, then the minimum end of the range is inclusive.
   * Likewise, passing `includeMax` as `true` makes the upper end inclusive.
   *
   * If `alwaysIncludeMaxPreRelease` is `true`, this will always include
   * pre-release versions of an exclusive `max`. Otherwise, it will use the
   * default behavior for pre-release versions of `max`.
   *
   * @param {Version=} min
   * @param {Version=} max
   * @param {boolean} [includeMin=false]
   * @param {boolean} [includeMax=false]
   * @param {boolean} [alwaysIncludeMaxPreRelease=false]
   * @memberof VersionRange
   */
  constructor(
    min,
    max,
    includeMin = false,
    includeMax = false,
    alwaysIncludeMaxPreRelease = false,
  ) {
    super();
    if (min != null && max != null && min.greaterThan(max)) {
      throw new ArgumentError(
        `Minimum version ("${min}") must be less than maximum ("${max}").`,
      );
    }
    if (
      !alwaysIncludeMaxPreRelease &&
      !includeMax &&
      max != null &&
      !max.isPreRelease() &&
      max.build.isEmpty() &&
      (min == null || !min.isPreRelease() || !equalsWithoutPreRelease(min, max))
    ) {
      max = max.firstPreRelease();
    }
    if (this.min == null) {
      this.min = min;
    }
    if (this.max == null) {
      this.max = max;
    }
    if (this.includeMin == null) {
      this.includeMin = includeMin;
    }
    if (this.includeMax == null) {
      this.includeMax = includeMax;
    }
  }

  /**
   * Returns `true` if [this] constraint has the same ranges as [other].
   *
   * @param {*} other
   * @returns {boolean}
   * @memberof VersionRange
   */
  equals(other) {
    if (!(other instanceof VersionRange)) {
      return false;
    }

    return (
      is(this.min, other.min) &&
      is(this.max, other.max) &&
      this.includeMin == other.includeMin &&
      this.includeMax == other.includeMax
    );
  }

  /**
   * Computes and returns the hashed identity for this VersionRange.
   * This is used by Immutable-JS' `is` function.
   *
   * @returns {number}
   * @memberof VersionRange
   */
  hashCode() {
    return (
      hash(this.min) ^
      (hash(this.max) * 3) ^
      (hash(this.includeMin) * 5) ^
      (hash(this.includeMax) * 7)
    );
  }

  /**
   * Returns `true` if this constraint allows no versions.
   *
   * @readonly
   * @returns {boolean}
   * @memberof VersionRange
   */
  isEmpty() {
    return false;
  }

  /**
   * Returns `true` if this constraint allows all versions.
   *
   * @returns {boolean}
   * @readonly
   * @memberof VersionRange
   */
  isAny() {
    return this.min == null && this.max == null;
  }

  /**
   * Tests if `other` falls within this version range.
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof VersionRange
   */
  allows(other) {
    if (this.min != null) {
      if (other.lessThan(this.min)) {
        return false;
      }
      if (!this.includeMin && is(other, this.min)) {
        return false;
      }
    }
    if (this.max != null) {
      if (other.greaterThan(this.max)) {
        return false;
      }
      if (!this.includeMax && is(other, this.max)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns `true` if this version range allows all the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof VersionRange
   */
  allowsAll(other) {
    if (other.isEmpty()) {
      return true;
    }
    if (other instanceof Version) {
      return this.allows(other);
    }
    if (other instanceof VersionUnion) {
      return other.ranges.every(constraint => this.allowsAll(constraint));
    }
    if (other instanceof VersionRange) {
      return !allowsLower(other, this) && !allowsHigher(other, this);
    }
    throw new ArgumentError(`Unknown VersionConstraint type ${other}.`);
  }

  /**
   * Returns `true` if this version range allows any of the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof VersionRange
   */
  allowsAny(other) {
    if (other.isEmpty()) {
      return false;
    }
    if (other instanceof Version) {
      return this.allows(other);
    }
    if (other instanceof VersionUnion) {
      return other.ranges.some(constraint => this.allowsAny(constraint));
    }
    if (other instanceof VersionRange) {
      return !strictlyLower(other, this) && !strictlyHigher(other, this);
    }
    throw new ArgumentError(`Unknown VersionConstraint type ${other}.`);
  }

  /**
   * Returns a [VersionConstraint] that only allows [Version]s allowed by both this and [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof VersionRange
   */
  intersect(other) {
    if (other.isEmpty()) {
      return other;
    }
    if (other instanceof VersionUnion) {
      return other.intersect(this);
    }
    // A range and a Version just yields the version if it's in the range.
    if (other instanceof Version) {
      return this.allows(other) ? other : VersionConstraint.empty;
    }
    if (other instanceof VersionRange) {
      // Intersect the two ranges.
      /**
       * @type {Version | undefined}
       */
      let intersectMin;
      let intersectIncludeMin;
      if (allowsLower(this, other)) {
        if (strictlyLower(this, other)) {
          return VersionConstraint.empty;
        }
        intersectMin = other.min;
        intersectIncludeMin = other.includeMin;
      } else {
        if (strictlyLower(other, this)) {
          return VersionConstraint.empty;
        }
        intersectMin = this.min;
        intersectIncludeMin = this.includeMin;
      }
      let intersectMax;
      let intersectIncludeMax;
      if (allowsHigher(this, other)) {
        intersectMax = other.max;
        intersectIncludeMax = other.includeMax;
      } else {
        intersectMax = this.max;
        intersectIncludeMax = this.includeMax;
      }
      if (intersectMin == null && intersectMax == null) {
        // Open range.
        return new VersionRange();
      }
      // If the range is just a single version.
      if (intersectMin instanceof Version && is(intersectMin, intersectMax)) {
        // Because we already verified that the lower range isn't strictly
        // lower, there must be some overlap.
        assert(intersectIncludeMin && intersectIncludeMax);

        return intersectMin;
      }

      // If we got here, there is an actual range.
      return new VersionRange(
        intersectMin,
        intersectMax,
        intersectIncludeMin,
        intersectIncludeMax,
        true,
      );
    }
    throw new ArgumentError(`Unknown VersionConstraint type ${other}.`);
  }

  /**
   * Returns a [VersionConstraint] that allows [Versions]s allowed by either this or [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof VersionRange
   */
  union(other) {
    if (other instanceof Version) {
      if (this.allows(other)) {
        return this;
      }
      if (is(other, this.min)) {
        return new VersionRange(
          this.min,
          this.max,
          true,
          this.includeMax,
          true,
        );
      }
      if (is(other, this.max)) {
        return new VersionRange(
          this.min,
          this.max,
          this.includeMin,
          true,
          true,
        );
      }

      return VersionConstraint.unionOf(List([this, other]));
    }
    if (other instanceof VersionRange) {
      // If the two ranges don't overlap, we won't be able to create a single
      // VersionRange for both of them.
      const edgesTouch =
        (is(this.max, other.min) && (this.includeMax || other.includeMin)) ||
        (is(this.min, other.max) && (this.includeMin || other.includeMax));
      if (!edgesTouch && !this.allowsAny(other)) {
        return VersionConstraint.unionOf(List([this, other]));
      }
      let unionMin;
      let unionIncludeMin;
      if (allowsLower(this, other)) {
        unionMin = this.min;
        unionIncludeMin = this.includeMin;
      } else {
        unionMin = other.min;
        unionIncludeMin = other.includeMin;
      }
      let unionMax;
      let unionIncludeMax;
      if (allowsHigher(this, other)) {
        unionMax = this.max;
        unionIncludeMax = this.includeMax;
      } else {
        unionMax = other.max;
        unionIncludeMax = other.includeMax;
      }

      return new VersionRange(
        unionMin,
        unionMax,
        unionIncludeMin,
        unionIncludeMax,
        true,
      );
    }

    return VersionConstraint.unionOf(List([this, other]));
  }

  /**
   * Returns a [VersionConstraint] that allows [Version]s allowed by this but not [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof VersionRange
   */
  difference(other) {
    if (other.isEmpty()) {
      return this;
    }
    if (other instanceof Version) {
      if (!this.allows(other)) {
        return this;
      }
      if (is(other, this.min)) {
        if (!this.includeMin) {
          return this;
        }

        return new VersionRange(
          this.min,
          this.max,
          false,
          this.includeMax,
          true,
        );
      }
      if (is(other, this.max)) {
        if (!this.includeMax) {
          return this;
        }

        return new VersionRange(
          this.min,
          this.max,
          this.includeMin,
          false,
          true,
        );
      }

      return VersionUnion.fromRanges(
        List([
          new VersionRange(this.min, other, this.includeMin, false, true),
          new VersionRange(other, this.max, false, this.includeMax, true),
        ]),
      );
    } else if (other instanceof VersionRange) {
      if (!this.allowsAny(other)) {
        return this;
      }
      let before;
      if (!allowsLower(this, other)) {
        before = null;
      } else if (is(this.min, other.min)) {
        assert(this.includeMin && !other.includeMin);
        assert(this.min != null);
        before = this.min;
      } else {
        before = new VersionRange(
          this.min,
          other.min,
          this.includeMin,
          !other.includeMin,
          true,
        );
      }
      let after;
      if (!allowsHigher(this, other)) {
        after = null;
      } else if (is(this.max, other.max)) {
        assert(this.includeMax && !other.includeMax);
        assert(this.max != null);
        after = this.max;
      } else {
        after = new VersionRange(
          other.max,
          this.max,
          !other.includeMax,
          this.includeMax,
          true,
        );
      }
      if (before == null && after == null) {
        return VersionConstraint.empty;
      } else if (before == null && after) {
        return after;
      } else if (after == null && before) {
        return before;
      }
      if (before && after) {
        return VersionUnion.fromRanges(List([before, after]));
      } else {
        throw new Error("before and after are both null or undefined.");
      }
    } else if (other instanceof VersionUnion) {
      let ranges = List();
      let current;
      for (const range of other.ranges) {
        // Skip any ranges that are strictly lower than `current`.
        if (strictlyLower(range, current)) {
          continue;
        }
        // If we reach a range strictly higher than `current`, no more ranges
        // will be relevant so we can bail early.
        if (strictlyHigher(range, current)) {
          break;
        }
        const difference = current.difference(range);
        if (difference.isEmpty()) {
          return VersionConstraint.empty;
        } else if (difference instanceof VersionUnion) {
          // If `range` split `current` in half, we only need to continue
          // checking future ranges against the latter half.
          assert(difference.ranges.size == 2);
          ranges = ranges.push(difference.ranges.first());
          current = difference.ranges.last();
        } else {
          current = difference;
        }
      }
      if (ranges.isEmpty()) {
        return current;
      }

      return VersionUnion.fromRanges(ranges.push(current));
    }
    throw new ArgumentError(`Unknown VersionConstraint type ${other}.`);
  }

  /**
   * returns -1 if [this] is lower than [other]
   * returns 1 if [other] is lower than [this]
   *
   * @param {VersionRange | Version} other
   * @returns {number}
   * @memberof VersionRange
   */
  compareTo(other) {
    if (this.min == null) {
      if (other.min == null) {
        return this._compareMax(other);
      }

      return -1;
    } else if (other.min == null) {
      return 1;
    }
    const result = this.min.compareTo(other.min);
    if (result != 0) {
      return result;
    }
    if (this.includeMin != other.includeMin) {
      return this.includeMin ? -1 : 1;
    }

    return this._compareMax(other);
  }

  /**
   * Compares the maximum values of `this` and `other`.
   *
   * @param {VersionRange | Version} other
   * @returns {number}
   * @memberof VersionRange
   */
  _compareMax(other) {
    if (this.max == null) {
      if (other.max == null) {
        return 0;
      }

      return 1;
    } else if (other.max == null) {
      return -1;
    }
    const result = this.max.compareTo(other.max);
    if (result != 0) {
      return result;
    }
    if (this.includeMax != other.includeMax) {
      return this.includeMax ? 1 : -1;
    }

    return 0;
  }

  /**
   * String representation of [this]
   *
   * @returns {string}
   * @memberof VersionRange
   */
  toString() {
    let buffer = "";
    if (this.min != null) {
      buffer += this.includeMin ? ">=" : ">";
      buffer += this.min;
    }
    if (this.max != null) {
      if (this.min != null) {
        buffer += " ";
      }
      if (this.includeMax) {
        buffer += "<=";
        buffer += this.max;
      } else {
        buffer += "<";
        if (this.max.isFirstPreRelease()) {
          // Since `"<${max}"` would parse the same as `"<${max}-0"`, we just emit
          // `<${max}` to avoid confusing "-0" suffixes.
          buffer += `${this.max.major}.${this.max.minor}.${this.max.patch}`;
        } else {
          buffer += this.max;
          // If `">=${min} <${max}"` would parse as `">=${min} <${max}-0"`, add `-*` to
          // indicate that actually does allow pre-release versions.
          const minIsPreReleaseOfMax =
            this.min != null &&
            this.min.isPreRelease() &&
            equalsWithoutPreRelease(this.min, this.max);
          if (
            !this.max.isPreRelease() &&
            this.max.build.isEmpty() &&
            !minIsPreReleaseOfMax
          ) {
            buffer += "-∞";
          }
        }
      }
    }
    if (this.min == null && this.max == null) {
      buffer += "*";
    }

    return buffer;
  }
}

/**
 * A parsed semantic version number.
 *
 * @class Version
 * @implements {VersionConstraint}
 * @extends {VersionRange}
 */
class Version extends VersionRange {
  /**
   * Creates an instance of Version.
   * @param {number} major
   * @param {number} minor
   * @param {number} patch
   * @param {string=} preRelease
   * @param {string=} build
   * @param {string=} _text
   * @memberof Version
   */
  constructor(major, minor, patch, preRelease, build, _text) {
    if (major < 0) {
      throw new ArgumentError("Major version must be non-negative.");
    }
    if (minor < 0) {
      throw new ArgumentError("Minor version must be non-negative.");
    }
    if (patch < 0) {
      throw new ArgumentError("Patch version must be non-negative.");
    }
    let text = `${major}.${minor}.${patch}`;
    if (preRelease != null) {
      text += `-${preRelease}`;
    }
    if (build != null) {
      text += `+${build}`;
    }
    super();
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.preRelease =
      preRelease == null ? List() : Version._splitParts(preRelease);
    this.build = build == null ? List() : Version._splitParts(build);
    this._text = _text ? _text : text;
  }

  /**
   * No released version: i.e. "0.0.0".
   *
   * @returns {Version}
   * @readonly
   * @static
   * @memberof Version
   */
  static get none() {
    return new Version(0, 0, 0);
  }

  /**
   *
   * @returns {Version}
   * @readonly
   * @memberof Version
   */
  get min() {
    return this;
  }

  /**
   *
   * @returns {Version}
   * @readonly
   * @memberof Version
   */
  get max() {
    return this;
  }

  /**
   *
   * @returns {boolean}
   * @readonly
   * @memberof Version
   */
  get includeMin() {
    return true;
  }

  /**
   *
   * @returns {boolean}
   * @readonly
   * @memberof Version
   */
  get includeMax() {
    return true;
  }

  /**
   * Returns `true` if this constraint allows all versions.
   *
   * @returns {boolean}
   * @readonly
   * @memberof VersionUnion
   */
  isAny() {
    return false;
  }

  /**
   * Returns `true` if this constraint allows no versions.
   *
   * @readonly
   * @returns {boolean}
   * @memberof Version
   */
  isEmpty() {
    return false;
  }

  /**
   * Whether or not this is a pre-release version.
   *
   * @returns {boolean}
   * @readonly
   * @memberof Version
   */
  isPreRelease() {
    return this.preRelease.size != 0;
  }

  /**
   * Gets the next breaking version number that follows this one.
   *
   * Increments `major` if it's greater than zero, otherwise `minor`, resets
   * subsequent digits to zero, and strips any `preRelease` or `build`
   * suffix.
   *
   * @returns {Version}
   * @readonly
   * @memberof Version
   */
  nextBreaking() {
    if (this.major == 0) {
      return this._incrementMinor();
    }

    return this._incrementMajor();
  }

  /**
   * Returns the first possible pre-release of this version.
   *
   * @returns {Version}
   * @readonly
   * @memberof Version
   */
  firstPreRelease() {
    return new Version(this.major, this.minor, this.patch, "0");
  }

  /**
   * Returns whether this is the first possible pre-release of its version.
   *
   * @returns {boolean}
   * @readonly
   * @memberof Version
   */
  isFirstPreRelease() {
    return this.preRelease.size == 1 && this.preRelease.first() == 0;
  }

  /**
   * Compares `a` and `b` to see which takes priority over the other.
   *
   * Returns `1` if `a` takes priority over `b` and `-1` if vice versa. If
   * `a` and `b` are equivalent, returns `0`.
   *
   * Unlike `compareTo`, which *orders* versions, this determines which
   * version a user is likely to prefer. In particular, it prioritizes
   * pre-release versions lower than stable versions, regardless of their
   * version numbers. Pub uses this when determining which version to prefer
   * when a number of versions are allowed. In that case, it will always
   * choose a stable version when possible.
   *
   * When used to sort a list, orders in ascending priority so that the
   * highest priority version is *last* in the result.
   *
   * @static
   * @param {Version} a
   * @param {Version} b
   * @returns {number}
   * @memberof Version
   */
  static prioritize(a, b) {
    // Sort all prerelease versions after all normal versions. This way
    // the solver will prefer stable packages over unstable ones.
    if (a.isPreRelease() && !b.isPreRelease()) {
      return -1;
    }
    if (!a.isPreRelease() && b.isPreRelease()) {
      return 1;
    }

    return a.compareTo(b);
  }

  /**
   * Like `prioritize`, but lower version numbers are considered greater than
   * higher version numbers.
   *
   * This still considers prerelease versions to be lower than non-prerelease
   * versions. Pub uses this when downgrading -- it chooses the lowest version
   * but still excludes pre-release versions when possible.
   *
   * @static
   * @param {Version} a
   * @param {Version} b
   * @returns {number}
   * @memberof Version
   */
  static antiprioritize(a, b) {
    if (a.isPreRelease() && !b.isPreRelease()) {
      return -1;
    }
    if (!a.isPreRelease() && b.isPreRelease()) {
      return 1;
    }

    return b.compareTo(a);
  }

  /**
   * Creates a new `Version` by parsing `text`.
   *
   * @static
   * @param {string} text
   * @returns {Version}
   * @memberof Version
   */
  static parse(text) {
    const match = COMPLETE_VERSION.exec(text);
    if (match == null) {
      throw new FormatError(`Could not parse "${text}".`);
    }
    try {
      const major = Number.parseInt(match[1], 10);
      const minor = Number.parseInt(match[2], 10);
      const patch = Number.parseInt(match[3], 10);
      const preRelease = match[5];
      const build = match[8];

      return new Version(major, minor, patch, preRelease, build, text);
    } catch (error) {
      if (error instanceof FormatError) {
        throw new FormatError(`Could not parse "${text}".`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Returns the primary version out of a list of candidates.
   *
   * This is the highest-numbered stable (non-prerelease) version. If there
   * are no stable versions, it's just the highest-numbered version.
   *
   * @static
   * @param {import('immutable').List<Version>} versions
   * @returns {Version | null}
   * @memberof Version
   */
  static primary(versions) {
    let primary = null;
    for (const version of versions) {
      if (
        primary == null ||
        (!version.isPreRelease() && primary.isPreRelease()) ||
        (version.isPreRelease() == primary.isPreRelease() &&
          version.greaterThan(primary))
      ) {
        primary = version;
      }
    }

    return primary;
  }

  /**
   * Splits a string of dot-delimited identifiers into their component parts.
   *
   * Identifiers that are numeric are converted to numbers.
   *
   * @static
   * @param {string} text
   * @returns {import('immutable').List<string | number>}
   * @memberof Version
   */
  static _splitParts(text) {
    return List(
      text.split(".").map(part => {
        const result = Number.parseInt(part, 10);
        if (Number.isNaN(result)) {
          return part;
        } else {
          return result;
        }
      }),
    );
  }

  /**
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof Version
   */
  lessThan(other) {
    return this.compareTo(other) < 0;
  }

  /**
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof Version
   */
  greaterThan(other) {
    return this.compareTo(other) > 0;
  }

  /**
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof Version
   */
  lessThanOrEqual(other) {
    return this.compareTo(other) <= 0;
  }

  /**
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof Version
   */
  greaterThanOrEqual(other) {
    return this.compareTo(other) >= 0;
  }

  /**
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof Version
   */
  equals(other) {
    if (!(other instanceof Version)) {
      return false;
    }

    return (
      this.major == other.major &&
      this.minor == other.minor &&
      this.patch == other.patch &&
      is(this.preRelease, other.preRelease) &&
      is(this.build, other.build)
    );
  }

  /**
   * Computes and returns the hashed identity for [this].
   * This is used by Immutable-JS' `is` function.
   *
   * @returns {number}
   * @memberof Version
   */
  hashCode() {
    return (
      this.major ^
      this.minor ^
      this.patch ^
      hash(this.preRelease) ^
      hash(this.build)
    );
  }

  /**
   * @returns {Version}
   * @memberof Version
   */
  _incrementMajor() {
    return new Version(this.major + 1, 0, 0);
  }

  /**
   * @returns {Version}
   * @memberof Version
   */
  _incrementMinor() {
    return new Version(this.major, this.minor + 1, 0);
  }

  /**
   * @returns {Version}
   * @memberof Version
   */
  _incrementPatch() {
    return new Version(this.major, this.minor, this.patch + 1);
  }

  /**
   * Tests if `other` matches this version exactly.
   *
   * @param {Version} other
   * @returns {boolean}
   * @memberof Version
   */
  allows(other) {
    return is(this, other);
  }

  /**
   * Returns `true` if this constraint allows all the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof Version
   */
  allowsAll(other) {
    return other.isEmpty() || is(other, this);
  }

  /**
   * Returns `true` if this constraint allows any of the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof Version
   */
  allowsAny(other) {
    return other.allows(this);
  }

  /**
   * Returns a [VersionConstraint] that only allows [Version]s allowed by both this and [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof Version
   */
  intersect(other) {
    return other.allows(this) ? this : VersionConstraint.empty;
  }

  /**
   * Returns a [VersionConstraint] that allows [Versions]s allowed by either this or [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof Version
   */
  union(other) {
    if (other.allows(this)) {
      return other;
    }
    if (other instanceof VersionRange) {
      if (is(other.min, this)) {
        return new VersionRange(
          other.min,
          other.max,
          true,
          other.includeMax,
          true,
        );
      }
      if (is(other.max, this)) {
        return new VersionRange(
          other.min,
          other.max,
          other.includeMin,
          true,
          true,
        );
      }
    }

    return VersionConstraint.unionOf(List([this, other]));
  }

  /**
   * Returns a [VersionConstraint] that allows [Version]s allowed by this but not [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof Version
   */
  difference(other) {
    return other.allows(this) ? VersionConstraint.empty : this;
  }

  /**
   * returns -1 if [this] is lower than [other]
   * returns 1 if [other] is lower than [this]
   *
   * @param {VersionRange} other
   * @returns {number}
   * @memberof Version
   */
  compareTo(other) {
    if (other instanceof Version) {
      if (this.major != other.major) {
        return compareNumbers(this.major, other.major);
      }
      if (this.minor != other.minor) {
        return compareNumbers(this.minor, other.minor);
      }
      if (this.patch != other.patch) {
        return compareNumbers(this.patch, other.patch);
      }
      // Pre-releases always come before no pre-release string.
      if (!this.isPreRelease() && other.isPreRelease()) {
        return 1;
      }
      if (!other.isPreRelease() && this.isPreRelease()) {
        return -1;
      }
      const comparison = this._compareLists(this.preRelease, other.preRelease);
      if (comparison != 0) {
        return comparison;
      }
      // Builds always come after no build string.
      if (this.build.isEmpty() && !other.build.isEmpty()) {
        return -1;
      }
      if (other.build.isEmpty() && !this.build.isEmpty()) {
        return 1;
      }

      return this._compareLists(this.build, other.build);
    } else {
      return -other.compareTo(this);
    }
  }

  /**
   * String representation of [this].
   *
   * @returns {string}
   * @memberof Version
   */
  toString() {
    return this._text;
  }

  /**
   * Compares a dot-separated component of two versions.
   *
   * This is used for the pre-release and build version parts. This follows
   * Rule 12 of the Semantic Versioning spec (v2.0.0-rc.1).
   *
   * @param {import('immutable').List<number | string>} a
   * @param {import('immutable').List<number | string>} b
   * @returns {number}
   * @memberof Version
   */
  _compareLists(a, b) {
    for (let i = 0; i < Math.max(a.size, b.size); i++) {
      const aPart = i < a.size ? a.get(i) : null;
      const bPart = i < b.size ? b.get(i) : null;
      if (aPart == bPart) {
        continue;
      }
      // Missing parts come before present ones.
      if (aPart == null) {
        return -1;
      }
      if (bPart == null) {
        return 1;
      }
      if (typeof aPart == "number") {
        if (typeof bPart == "number") {
          // Compare two numbers.
          return compareNumbers(aPart, bPart);
        } else {
          // Numbers come before strings.
          return -1;
        }
      } else {
        if (typeof bPart == "number") {
          // Strings come after numbers.
          return 1;
        } else {
          // Compare two strings.
          return aPart.localeCompare(bPart);
        }
      }
    }

    // The lists are entirely equal.
    return 0;
  }
}

/**
 *
 *
 * @class CompatibleWithVersionRange
 * @extends {VersionRange}
 */
class CompatibleWithVersionRange extends VersionRange {
  /**
   * Creates an instance of CompatibleWithVersionRange.
   * @param {Version} version
   * @memberof CompatibleWithVersionRange
   */
  constructor(version) {
    super(version, version.nextBreaking().firstPreRelease(), true, false);
  }

  /**
   * SemVer string version of the instance.
   *
   * @returns {string}
   * @memberof CompatibleWithVersionRange
   */
  toString() {
    return `^${this.min}`;
  }
}

/**
 * A version constraint representing a union of multiple disjoint version
 * ranges.
 *
 * An instance of this will only be created if the version can't be represented
 * as a non-compound value.
 *
 * @implements {VersionConstraint}
 * @class VersionUnion
 */
class VersionUnion extends VersionConstraint {
  /**
   * Creates an instance of VersionUnion.
   * @param {import('immutable').List<VersionRange>} ranges
   * @memberof VersionUnion
   */
  constructor(ranges) {
    super();
    this.ranges = ranges;
  }

  /**
   * Creates a union from a list of ranges with no pre-processing.
   *
   * It's up to the caller to ensure that the invariants described in `ranges`
   * are maintained. They are not verified by this constructor. To
   * automatically ensure that they're maintained, use `new
   * VersionConstraint.unionOf` instead.
   *
   * @static
   * @param {import('immutable').List<VersionRange>} ranges
   * @returns {VersionUnion}
   * @memberof VersionUnion
   */
  static fromRanges(ranges) {
    return new VersionUnion(ranges);
  }

  /**
   * Returns `true` if this constraint allows no versions.
   *
   * @readonly
   * @returns {boolean}
   * @memberof VersionUnion
   */
  isEmpty() {
    return false;
  }

  /**
   * Returns `true` if this constraint allows all versions.
   *
   * @returns {boolean}
   * @readonly
   * @memberof VersionUnion
   */
  isAny() {
    return false;
  }

  /**
   * Returns `true` if this constraint allows [version].
   *
   * @param {Version} version
   * @returns {boolean}
   * @memberof VersionUnion
   */
  allows(version) {
    return this.ranges.some(constraint => constraint.allows(version));
  }

  /**
   * Returns `true` if this constraint allows all the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof VersionUnion
   */
  allowsAll(other) {
    const ourRanges = this.ranges.values();
    const theirRanges = this._rangesFor(other).values();
    // Because both lists of ranges are ordered by minimum version, we can
    // safely move through them linearly here.
    let ourCurrent = ourRanges.next().value;
    let theirCurrent = theirRanges.next().value;
    while (ourCurrent != null && theirCurrent != null) {
      if (ourCurrent.allowsAll(theirCurrent)) {
        theirCurrent = theirRanges.next().value;
      } else {
        ourCurrent = ourRanges.next().value;
      }
    }

    // If our ranges have allowed all of their ranges, we'll have consumed all
    // of them.
    return theirCurrent == null;
  }

  /**
   * Returns `true` if this constraint allows any of the versions that [other] allows.
   *
   * @param {VersionConstraint} other
   * @returns {boolean}
   * @memberof VersionUnion
   */
  allowsAny(other) {
    const ourRanges = this.ranges.values();
    const theirRanges = this._rangesFor(other).values();
    // Because both lists of ranges are ordered by minimum version, we can
    // safely move through them linearly here.
    let ourCurrent = ourRanges.next().value;
    let theirCurrent = theirRanges.next().value;
    while (ourCurrent != null && theirCurrent != null) {
      if (ourCurrent.allowsAny(theirCurrent)) {
        return true;
      }
      // Move the constraint with the lower max value forward. This ensures that
      // we keep both lists in sync as much as possible.
      if (allowsHigher(theirCurrent, ourCurrent)) {
        ourCurrent = ourRanges.next().value;
      } else {
        theirCurrent = theirRanges.next().value;
      }
    }

    return false;
  }

  /**
   * Returns a [VersionConstraint] that only allows [Version]s allowed by both this and [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof VersionUnion
   */
  intersect(other) {
    const ourRanges = this.ranges.values();
    const theirRanges = this._rangesFor(other).values();
    // Because both lists of ranges are ordered by minimum version, we can
    // safely move through them linearly here.
    let newRanges = List();
    let ourCurrent = ourRanges.next().value;
    let theirCurrent = theirRanges.next().value;
    while (ourCurrent != null && theirCurrent != null) {
      const intersection = ourCurrent.intersect(theirCurrent);
      if (!intersection.isEmpty()) {
        newRanges = newRanges.push(intersection);
      }
      // Move the constraint with the lower max value forward. This ensures that
      // we keep both lists in sync as much as possible, and that large ranges
      // have a chance to match multiple small ranges that they contain.
      if (allowsHigher(theirCurrent, ourCurrent)) {
        ourCurrent = ourRanges.next().value;
      } else {
        theirCurrent = theirRanges.next().value;
      }
    }
    if (newRanges.isEmpty()) {
      return VersionConstraint.empty;
    }
    if (newRanges.size == 1) {
      return newRanges.first();
    }

    return VersionUnion.fromRanges(newRanges);
  }

  /**
   * Returns a [VersionConstraint] that allows [Version]s allowed by this but not [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof VersionUnion
   */
  difference(other) {
    const ourRanges = this.ranges.values();
    const theirRanges = this._rangesFor(other).values();
    let newRanges = List();
    let ourCurrent = ourRanges.next();
    let theirCurrent = theirRanges.next();
    let current = ourCurrent.value;
    function theirNextRange() {
      theirCurrent = theirRanges.next();
      if (!theirCurrent.done) {
        return true;
      }
      // If there are no more of their ranges, none of the rest of our ranges
      // need to be subtracted so we can add them as-is.
      newRanges = newRanges.push(current);
      while (!ourCurrent.done) {
        ourCurrent = ourRanges.next();
        newRanges = newRanges.push(ourCurrent.value);
      }

      return false;
    }
    function ourNextRange(includeCurrent = true) {
      if (includeCurrent) {
        newRanges = newRanges.push(current);
      }
      ourCurrent = ourRanges.next();
      if (ourCurrent.done) {
        return false;
      }
      current = ourCurrent.value;

      return true;
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // If the current ranges are disjoint, move the lowest one forward.
      if (strictlyLower(theirCurrent.value, current)) {
        if (!theirNextRange()) {
          break;
        }
        continue;
      }
      if (strictlyHigher(theirCurrent.value, current)) {
        if (!ourNextRange()) {
          break;
        }
        continue;
      }
      // If we're here, we know `theirRanges.current` overlaps `current`.
      const difference = current.difference(theirCurrent.value);
      if (difference instanceof VersionUnion) {
        // If their range split `current` in half, we only need to continue
        // checking future ranges against the latter half.
        assert(difference.ranges.size == 2);
        newRanges = newRanges.push(difference.ranges.first());
        current = difference.ranges.last();
        // Since their range split `current`, it definitely doesn't allow higher
        // versions, so we should move their ranges forward.
        if (!theirNextRange()) {
          break;
        }
      } else if (difference.isEmpty()) {
        if (!ourNextRange(false)) {
          break;
        }
      } else {
        current = difference;
        // Move the constraint with the lower max value forward. This ensures
        // that we keep both lists in sync as much as possible, and that large
        // ranges have a chance to subtract or be subtracted by multiple small
        // ranges that they contain.
        if (allowsHigher(current, theirCurrent.value)) {
          if (!theirNextRange()) {
            break;
          }
        } else {
          if (!ourNextRange()) {
            break;
          }
        }
      }
    }
    if (newRanges.isEmpty()) {
      return VersionConstraint.empty;
    }
    if (newRanges.size == 1) {
      return newRanges.first();
    }

    return VersionUnion.fromRanges(newRanges);
  }

  /**
   * Returns `constraint` as a list of ranges.
   *
   * This is used to normalize ranges of various types.
   *
   * @param {VersionConstraint} constraint
   * @returns {import('immutable').List<VersionRange>}
   * @memberof VersionUnion
   */
  _rangesFor(constraint) {
    if (constraint.isEmpty()) {
      return List();
    }
    if (constraint instanceof VersionUnion) {
      return constraint.ranges;
    }
    if (constraint instanceof VersionRange) {
      return List([constraint]);
    }
    throw new ArgumentError(`Unknown VersionConstraint type ${constraint}.`);
  }

  /**
   * Returns a [VersionConstraint] that allows [Versions]s allowed by either this or [other].
   *
   * @param {VersionConstraint} other
   * @returns {VersionConstraint}
   * @memberof _EmptyVersion
   */
  union(other) {
    return VersionConstraint.unionOf(List([this, other]));
  }

  /**
   * Returns `true` if this constraint has the same ranges as [other].
   *
   * @param {*} other
   * @returns {boolean}
   * @memberof VersionUnion
   */
  equals(other) {
    if (!(other instanceof VersionUnion)) {
      return false;
    }

    return is(this.ranges, other.ranges);
  }

  /**
   * Computes and returns the hashed identity for this VersionUnion.
   * This is used by Immutable-JS' `is` function.
   *
   * @returns {number}
   * @memberof VersionUnion
   */
  hashCode() {
    return hash(this.ranges);
  }

  /**
   * Returns string representation of the instance.
   *
   * @returns {string}
   * @memberof VersionUnion
   */
  toString() {
    return this.ranges.join(" or ");
  }
}

/**
 * A `VersionConstraint` that allows all versions.
 *
 * @static
 * @memberof VersionConstraint
 */
VersionConstraint.any = new VersionRange();

/**
 * A `VersionConstraint` that allows no versions -- the empty set.
 *
 * @static
 * @memberof VersionConstraint
 */
VersionConstraint.empty = new _EmptyVersion();

module.exports.VersionConstraint = VersionConstraint;
module.exports.CompatibleWithVersionRange = CompatibleWithVersionRange;
module.exports.Version = Version;
module.exports.VersionRange = VersionRange;
module.exports.VersionUnion = VersionUnion;
module.exports._EmptyVersion = _EmptyVersion;
