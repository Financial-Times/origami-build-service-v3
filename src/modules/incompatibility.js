"use strict";

const assert = require("assert");
const { Map } = require("immutable");
const { ConflictCause } = require("./conflict-cause");
const { IncompatibilityCause } = require("./incompatibility-cause");
const { PackageNotFoundCause } = require("./package-not-found-cause");

/**
 * A set of mutually-incompatible terms.
 *
 * See https://github.com/dart-lang/pub/tree/master/doc/solver.md#incompatibility.
 *
 * @class Incompatibility
 */
class Incompatibility {
  /**
   * Creates an incompatibility with `terms`.
   *
   * This normalizes `terms` so that each package has at most one term
   *
   * @param {Array<import('./term').Term>} terms
   * @param {IncompatibilityCause|ConflictCause} cause
   * @memberof Incompatibility
   */
  constructor(terms, cause) {
    // Remove the root package from generated incompatibilities, since it will
    // always be satisfied. This makes error reporting clearer, and may also
    // make solving more efficient.
    if (
      terms.length != 1 &&
      cause instanceof ConflictCause &&
      terms.some(term => term.isPositive && term.package.isRoot)
    ) {
      terms = terms.filter(term => !term.isPositive || !term.package.isRoot);
    }
    if (
      terms.length == 1 ||
      // Short-circuit in the common case of a two-term incompatibility with
      // two different packages (for example, a dependency).
      (terms.length == 2 &&
        terms[0].package.name != terms[terms.length - 1].package.name)
    ) {
      this.terms = terms;
      this.cause = cause;

      return this;
    }
    // Coalesce multiple terms about the same package if possible.
    let byName = Map();
    for (const term of terms) {
      if (!byName.has(term.package.name)) {
        byName = byName.set(term.package.name, Map());
      }
      let byRef = byName.get(term.package.name);
      const ref = term.package.toRef();
      if (byRef.has(ref)) {
        byRef = byRef.set(ref, byRef.get(ref).intersect(term));
        // If we have two terms that refer to the same package but have a null
        // intersection, they're mutually exclusive, making this incompatibility
        // irrelevant, since we already know that mutually exclusive version
        // ranges are incompatible. We should never derive an irrelevant
        // incompatibility.
        assert(byRef.get(ref) != null);
      } else {
        byRef = byRef.set(ref, term);
      }
    }
    terms = byName
      .valueSeq()
      .flatMap(byRef => {
        // If there are any positive terms for a given package, we can discard
        // any negative terms.
        const positiveTerms = byRef
          .valueSeq()
          .filter(term => term.isPositive)
          .toList();
        if (!positiveTerms.isEmpty()) {
          return positiveTerms;
        }

        return byRef.valueSeq();
      })
      .toArray();
    /**
     * @type {Array<import('./term').Term>}
     */
    this.terms = terms;
    /**
     * @type {IncompatibilityCause|ConflictCause}
     */
    this.cause = cause;

    return this;
  }

  /**
   * Whether this incompatibility indicates that version solving as a whole has failed.
   *
   * @type {boolean}
   * @memberof Incompatibility
   */
  get isFailure() {
    return (
      this.terms.length == 0 ||
      (this.terms.length == 1 && this.terms[0].package.isRoot)
    );
  }

  /**
   * Returns all external incompatibilities in this incompatibility's derivation graph.
   *
   * @returns {Iterable<Incompatibility>}
   * @memberof Incompatibility
   */
  *externalIncompatibilities() {
    if (this.cause instanceof ConflictCause) {
      const cause = this.cause;
      yield* cause.conflict.externalIncompatibilities();
      yield* cause.other.externalIncompatibilities();
    } else {
      yield this;
    }
  }

  /**
   * Returns a string representation of `this`.
   *
   * If `details` is passed, it controls the amount of detail that's written
   * for packages with the given names.
   *
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @returns {string}
   * @memberof Incompatibility
   */
  toString(details) {
    if (this.cause == IncompatibilityCause.dependency) {
      assert(this.terms.length == 2);
      const depender = this.terms[0];
      const dependee = this.terms[this.terms.length - 1];
      assert(depender.isPositive);
      assert(!dependee.isPositive);

      return `${this._terse(depender, details, true)} depends on ${this._terse(
        dependee,
        details,
      )}`;
    } else if (this.cause == IncompatibilityCause.noVersions) {
      assert(this.terms.length == 1);
      assert(this.terms[0].isPositive);

      return `no versions of ${this._terseRef(this.terms[0], details)} match ${
        this.terms[0].constraint
      }`;
    } else if (this.cause instanceof PackageNotFoundCause) {
      assert(this.terms.length == 1);
      assert(this.terms[0].isPositive);
      const cause = this.cause;

      return `${this._terseRef(this.terms[0], details)} doesn't exist (${
        cause.error.message
      })`;
    } else if (this.cause == IncompatibilityCause.root) {
      // `IncompatibilityCause.root` is only used when a package depends on the
      // entrypoint with an incompatible version, so we want to print the
      // entrypoint's actual version to make it clear why this failed.
      assert(this.terms.length == 1);
      assert(!this.terms[0].isPositive);
      assert(this.terms[0].package.isRoot);

      return `${this.terms[0].package.name} is ${this.terms[0].constraint}`;
    } else if (this.isFailure) {
      return "version solving failed";
    }
    if (this.terms.length == 1) {
      const term = this.terms[0];
      if (term.constraint.isAny) {
        return `${this._terseRef(term, details)} is ${
          term.isPositive ? "forbidden" : "required"
        }`;
      } else {
        return `${this._terse(term, details)} is ${
          term.isPositive ? "forbidden" : "required"
        }`;
      }
    }
    if (this.terms.length == 2) {
      const term1 = this.terms[0];
      const term2 = this.terms[this.terms.length - 1];
      if (term1.isPositive == term2.isPositive) {
        if (term1.isPositive) {
          const package1 = term1.constraint.isAny
            ? this._terseRef(term1, details)
            : this._terse(term1, details);
          const package2 = term2.constraint.isAny
            ? this._terseRef(term2, details)
            : this._terse(term2, details);

          return `${package1} is incompatible with ${package2}`;
        } else {
          return `either ${this._terse(term1, details)} or ${this._terse(
            term2,
            details,
          )}`;
        }
      }
    }
    const positive = [];
    const negative = [];
    for (const term of this.terms) {
      if (term.isPositive) {
        positive.push(this._terse(term, details));
      } else {
        negative.push(this._terse(term, details));
      }
    }
    if (!(positive.length === 0) && !(negative.length === 0)) {
      if (positive.length == 1) {
        const positiveTerm = this.terms.find(term => term.isPositive);
        if (!positiveTerm) {
          throw new Error("positiveTerm is undefined.");
        }

        return `${this._terse(
          positiveTerm,
          details,
          true,
        )} requires ${negative.join(" or ")}`;
      } else {
        return `if ${positive.join(" and ")} then ${negative.join(" or ")}`;
      }
    } else if (!(positive.length === 0)) {
      return `one of ${positive.join(" or ")} must be false`;
    } else {
      return `one of ${negative.join(" or ")} must be true`;
    }
  }

  /**
   * Returns the equivalent of `"${this} and ${other}"`, with more intelligent
   * phrasing for specific patterns.
   *
   * If `details` is passed, it controls the amount of detail that's written
   * for packages with the given names.
   *
   * If `thisLine` and/or `otherLine` are passed, they indicate line numbers
   * that should be associated with `this` and `other`, respectively.
   *
   * @param {Incompatibility} other
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @param {number} [thisLine]
   * @param {number} [otherLine]
   * @returns {string}
   * @memberof Incompatibility
   */
  andToString(other, details, thisLine, otherLine) {
    const requiresBoth = this._tryRequiresBoth(
      other,
      details,
      thisLine,
      otherLine,
    );
    if (requiresBoth != null) {
      return requiresBoth;
    }
    const requiresThrough = this._tryRequiresThrough(
      other,
      details,
      thisLine,
      otherLine,
    );
    if (requiresThrough != null) {
      return requiresThrough;
    }
    const requiresForbidden = this._tryRequiresForbidden(
      other,
      details,
      thisLine,
      otherLine,
    );
    if (requiresForbidden != null) {
      return requiresForbidden;
    }
    let buffer = this.toString(details);
    if (thisLine != null) {
      buffer += ` ${thisLine}`;
    }
    buffer += ` and ${other.toString(details)}`;
    if (otherLine != null) {
      buffer += ` ${thisLine}`;
    }

    return buffer;
  }

  /**
   * If "`this` and `other`" can be expressed as "some package requires both X
   * and Y", this returns that expression.
   *
   * Otherwise, this returns `null`.
   *
   * @param {Incompatibility} other
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @param {number} [thisLine]
   * @param {number} [otherLine]
   * @returns {string | null}
   * @memberof Incompatibility
   */
  _tryRequiresBoth(other, details, thisLine, otherLine) {
    if (this.terms.length == 1 || other.terms.length == 1) {
      return null;
    }
    const thisPositive = this._singleTermWhere(term => term.isPositive);
    if (thisPositive == null) {
      return null;
    }
    const otherPositive = other._singleTermWhere(term => term.isPositive);
    if (otherPositive == null) {
      return null;
    }
    if (thisPositive.package != otherPositive.package) {
      return null;
    }
    const thisNegatives = this.terms
      .filter(term => !term.isPositive)
      .map(term => this._terse(term, details))
      .join(" or ");
    const otherNegatives = other.terms
      .filter(term => !term.isPositive)
      .map(term => this._terse(term, details))
      .join(" or ");
    let buffer = this._terse(thisPositive, details, true) + " ";
    const isDependency =
      this.cause == IncompatibilityCause.dependency &&
      other.cause == IncompatibilityCause.dependency;
    buffer += isDependency ? "depends on" : "requires";
    buffer += ` both ${thisNegatives}`;
    if (thisLine != null) {
      buffer += ` (${thisLine})`;
    }
    buffer += ` and ${otherNegatives}`;
    if (otherLine != null) {
      buffer += ` (${otherLine})`;
    }

    return buffer;
  }

  /**
   * If "`this` and `other`" can be expressed as "X requires Y which requires
   * Z", this returns that expression.
   *
   * Otherwise, this returns `null`.
   *
   * @param {Incompatibility} other
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @param {number} [thisLine]
   * @param {number} [otherLine]
   * @returns {string | null}
   * @memberof Incompatibility
   */
  _tryRequiresThrough(other, details, thisLine, otherLine) {
    if (this.terms.length == 1 || other.terms.length == 1) {
      return null;
    }
    const thisNegative = this._singleTermWhere(term => !term.isPositive);
    const otherNegative = other._singleTermWhere(term => !term.isPositive);
    if (thisNegative == null && otherNegative == null) {
      return null;
    }
    const thisPositive = this._singleTermWhere(term => term.isPositive);
    const otherPositive = other._singleTermWhere(term => term.isPositive);
    let prior;
    let priorNegative;
    let priorLine;
    let latter;
    let latterLine;
    if (
      thisNegative != null &&
      otherPositive != null &&
      thisNegative.package.name == otherPositive.package.name &&
      thisNegative.inverse.satisfies(otherPositive)
    ) {
      prior = this;
      priorNegative = thisNegative;
      priorLine = thisLine;
      latter = other;
      latterLine = otherLine;
    } else if (
      otherNegative != null &&
      thisPositive != null &&
      otherNegative.package.name == thisPositive.package.name &&
      otherNegative.inverse.satisfies(thisPositive)
    ) {
      prior = other;
      priorNegative = otherNegative;
      priorLine = otherLine;
      latter = this;
      latterLine = thisLine;
    } else {
      return null;
    }
    const priorPositives = prior.terms.filter(term => term.isPositive);
    let buffer = "";
    if (priorPositives.length > 1) {
      const priorString = priorPositives
        .map(term => this._terse(term, details))
        .join(" or ");
      buffer += `if ${priorString} then `;
    } else {
      const verb =
        prior.cause == IncompatibilityCause.dependency
          ? "depends on"
          : "requires";
      buffer += `${this._terse(priorPositives[0], details, true)} ${verb} `;
    }
    buffer += this._terse(priorNegative, details);
    if (priorLine != null) {
      buffer += ` (${priorLine})`;
    }
    buffer += " which ";
    if (latter.cause == IncompatibilityCause.dependency) {
      buffer += "depends on ";
    } else {
      buffer += "requires ";
    }
    buffer += latter.terms
      .filter(term => !term.isPositive)
      .map(term => this._terse(term, details))
      .join(" or ");
    if (latterLine != null) {
      buffer += ` (${latterLine})`;
    }

    return buffer;
  }

  /**
   * If "`this` and `other`" can be expressed as "X requires Y which is
   * forbidden", this returns that expression.
   *
   * Otherwise, this returns `null`.
   *
   * @param {Incompatibility} other
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @param {number} [thisLine]
   * @param {number} [otherLine]
   * @returns {string | null}
   * @memberof Incompatibility
   */
  _tryRequiresForbidden(other, details, thisLine, otherLine) {
    if (this.terms.length != 1 && other.terms.length != 1) {
      return null;
    }
    let prior;
    let latter;
    let priorLine;
    let latterLine;
    if (this.terms.length == 1) {
      prior = other;
      latter = this;
      priorLine = otherLine;
      latterLine = thisLine;
    } else {
      prior = this;
      latter = other;
      priorLine = thisLine;
      latterLine = otherLine;
    }
    const negative = prior._singleTermWhere(term => !term.isPositive);
    if (negative == null) {
      return null;
    }
    if (!negative.inverse.satisfies(latter.terms[0])) {
      return null;
    }
    const positives = prior.terms.filter(term => term.isPositive);
    let buffer = "";
    if (positives.length > 1) {
      const priorString = positives
        .map(term => this._terse(term, details))
        .join(" or ");
      buffer += `if ${priorString} then `;
    } else {
      buffer += this._terse(positives[0], details, true);
      buffer +=
        prior.cause == IncompatibilityCause.dependency
          ? " depends on "
          : " requires ";
    }
    buffer += `${this._terse(latter.terms[0], details)}@${
      latter.terms[0].constraint
    } `;
    if (priorLine != null) {
      buffer += `(${priorLine}) `;
    }
    if (latter.cause == IncompatibilityCause.noVersions) {
      buffer += "which doesn't match any versions";
    } else if (this.cause instanceof PackageNotFoundCause) {
      buffer += `which doesn't exist (${this.cause.error.message})`;
    } else {
      buffer += "which is forbidden";
    }
    if (latterLine != null) {
      buffer += ` (${latterLine})`;
    }

    return buffer;
  }

  /**
   * If exactly one term in this incompatibility matches `filter`, returns that
   * term.
   *
   * Otherwise, returns `null`.
   *
   * @param {(term: import('./term').Term) => boolean} filter
   * @returns {import('./term').Term | null}
   * @memberof Incompatibility
   */
  _singleTermWhere(filter) {
    let found = null;
    for (const term of this.terms) {
      if (!filter(term)) {
        continue;
      }
      if (found != null) {
        return null;
      }
      found = term;
    }

    return found;
  }

  /**
   * Returns a terse representation of `term`'s package ref.
   *
   * @param {import('./term').Term} term
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @returns {string}
   * @memberof Incompatibility
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  _terseRef(term, details) {
    return term.package
      .toRef()
      .toString(/*details == null ? null : details.get(term.package.name)*/);
  }

  /**
   * Returns a terse representation of `term`'s package.
   *
   * If `allowEvery` is `true`, this will return "every version of foo" instead
   * of "foo any".
   *
   * @param {import('./term').Term} term
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} [details]
   * @param {boolean} [allowEvery]
   * @returns {string}
   * @memberof Incompatibility
   */
  _terse(term, details, allowEvery = false) {
    if (allowEvery && term.constraint.isAny) {
      return `every version of ${this._terseRef(term, details)}`;
    } else {
      return term.package.toString(
        details == undefined
          ? undefined
          : details.get(term.package.name, undefined),
      );
    }
  }
}

module.exports.Incompatibility = Incompatibility;
