"use strict";

const { ConflictCause } = require("./ConflictCause");
const { equalsWithoutPreRelease } = require("./HOME");
const { Incompatibility } = require("./Incompatibility");
const { Pair } = require("./Pair");
const { Term } = require("./Term");
const { Version } = require("./Version");
const { VersionRange } = require("./Version");

/**
 * Replaces version ranges in `incompatibility` and its causes with more
 * human-readable (but less technically-accurate) ranges.
 *
 * We use a lot of ranges in the solver that explicitly allow pre-release
 * versions, such as `>=1.0.0-0 <2.0.0` or `>=1.0.0 <2.0.0-∞`. These ensure
 * that adjacent ranges can be merged together, which makes the solver's job
 * much easier. However, they're not super human-friendly, and in practice most
 * package versions don't actually have pre-releases available.
 *
 * This replaces lower bounds like `>=1.0.0-0` with the first version that
 * actually exists for a package, and upper bounds like `<2.0.0-∞` either with
 * the release version (`<2.0.0`) if no pre-releases exist or with an inclusive
 * bound on the last pre-release version that actually exists
 * (`<=2.0.0-dev.1`).
 *
 * @param {import('immutable').Map<import('./PackageName').PackageRef, import('./PackageLister').PackageLister>} packageListers
 * @param {Incompatibility} incompatibility
 * @returns {Incompatibility}
 */
function reformatRanges(packageListers, incompatibility) {
  let cause = incompatibility.cause;
  if (cause instanceof ConflictCause) {
    const conflict = cause;
    cause = new ConflictCause(
      reformatRanges(packageListers, conflict.conflict),
      reformatRanges(packageListers, conflict.other),
    );
  }

  return new Incompatibility(
    incompatibility.terms.map(term => _reformatTerm(packageListers, term)),
    _reformatCause(packageListers, cause),
  );
}

/**
 * Returns `term` with the upper and lower bounds of its package range reformatted if necessary.
 *
 * @param {import('immutable').Map<import('./PackageName').PackageRef, import('./PackageLister').PackageLister>} packageListers
 * @param {import('./Term').Term} term
 * @returns
 */
function _reformatTerm(packageListers, term) {
  let versions = [];
  if (packageListers.has(term.package.toRef())) {
    const packageLister = packageListers.get(term.package.toRef());
    if (packageLister) {
      versions = packageLister.cachedVersions;
    }
  }
  if (!(term.package.constraint instanceof VersionRange)) {
    return term;
  }
  if (term.package.constraint instanceof Version) {
    return term;
  }
  const range = term.package.constraint;
  const min = _reformatMin(versions, range);
  const tuple = _reformatMax(versions, range);
  const max = tuple != null ? tuple.first : null;
  const includeMax = tuple != null ? tuple.last : null;
  if (min == null && max == null) {
    return term;
  }

  return new Term(
    term.package
      .withConstraint(
        new VersionRange(
          min != null ? min : range.min,
          max != null ? max : range.max,
          range.includeMin,
          includeMax != null ? includeMax : range.includeMax,
          true,
        ),
      )
      .withTerseConstraint(),
    term.isPositive,
  );
}

/**
 * Returns the new minimum version to use for `range`, or `null` if it doesn't need to be reformatted.
 *
 * @param {import('./PackageName').PackageId[]} versions
 * @param {import('./Version').VersionRange} range
 * @returns
 */
function _reformatMin(versions, range) {
  if (range.min == null) {
    return null;
  }
  if (!range.includeMin) {
    return null;
  }
  if (!range.min.isFirstPreRelease) {
    return null;
  }
  const index = _lowerBound(versions, range.min);
  const next = index == versions.length ? null : versions[index].version;

  // If there's a real pre-release version of `range.min`, use that as the min.
  // Otherwise, use the release version.
  return next != null && equalsWithoutPreRelease(range.min, next)
    ? next
    : new Version(range.min.major, range.min.minor, range.min.patch);
}

/**
 * Returns the new maximum version to use for `range` and whether that maximum
 * is inclusive, or `null` if it doesn't need to be reformatted.
 *
 * @param {import('./PackageName').PackageId[]} versions
 * @param {import('./Version').VersionRange} range
 * @returns
 */
function _reformatMax(versions, range) {
  if (range.max == null) {
    return null;
  }
  if (range.includeMax) {
    return null;
  }
  if (range.max.isPreRelease) {
    return null;
  }
  if (
    range.min != null &&
    range.min.isPreRelease &&
    equalsWithoutPreRelease(range.min, range.max)
  ) {
    return null;
  }
  const index = _lowerBound(versions, range.max);
  const previous = index == 0 ? null : versions[index - 1].version;

  return previous != null && equalsWithoutPreRelease(previous, range.max)
    ? new Pair(previous, true)
    : new Pair(range.max.firstPreRelease, false);
}

/**
 * Returns the first index in `ids` (which is sorted by version) whose version
 * is greater than or equal to `version`.
 *
 * Returns `ids.size` if all the versions in `ids` are less than `version`.
 *
 * We can't use the `collection` package's `lowerBound()` function here because
 * `version` isn't the same as `ids`' element type.
 *
 * @param {import('./PackageName').PackageId[]} ids
 * @param {import('./Version').Version} version
 * @returns
 */
function _lowerBound(ids, version) {
  let min = 0;
  let max = ids.length;
  while (min < max) {
    const mid = min + ((max - min) >> 1);
    const id = ids[mid];
    if (id.version.compareTo(version) < 0) {
      min = mid + 1;
    } else {
      max = mid;
    }
  }

  return min;
}

/**
 * If `cause` is a `ConflictCause`, returns a copy of it with the
 * incompatibilities reformatted.
 *
 * Otherwise, returns it as-is.
 *
 * @param {import('immutable').Map<import('./PackageName').PackageRef, import('./PackageLister').PackageLister>} packageListers
 * @param {import('./ConflictCause').ConflictCause | import('./IncompatibilityCause').IncompatibilityCause} cause
 * @returns
 */
function _reformatCause(packageListers, cause) {
  return cause instanceof ConflictCause
    ? new ConflictCause(
        reformatRanges(packageListers, cause.conflict),
        reformatRanges(packageListers, cause.other),
      )
    : cause;
}

module.exports.reformatRanges = reformatRanges;
