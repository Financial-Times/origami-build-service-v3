"use strict";

const { ArgumentError } = require("./HOME");
const { SetRelation } = require("./SetRelation");
/**
 * A statement about a package which is true or false for a given selection of
 * package versions.
 *
 * See https://github.com/dart-lang/pub/tree/master/doc/solver.md#term.
 *
 * @class Term
 */
class Term {
  /**
   * Creates an instance of Term.
   * @param {import('./PackageName').PackageRange} $package
   * @param {boolean} isPositive
   * @memberof Term
   */
  constructor($package, isPositive) {
    this.package = $package.withTerseConstraint();
    this.isPositive = isPositive;
  }

  /**
   *  A copy of this term with the opposite `isPositive` value.
   * @returns {Term}
   * @readonly
   * @memberof Term
   */
  get inverse() {
    return new Term(this.package, !this.isPositive);
  }

  /**
   * @returns {import('./Version').VersionConstraint}
   * @readonly
   * @memberof Term
   */
  get constraint() {
    return this.package.constraint;
  }

  /**
   * Returns whether `this` satisfies `other`.
   *
   * That is, whether `this` being true means that `other` must also be true.
   *
   * @param {Term} other
   * @returns {boolean}
   * @memberof Term
   */
  satisfies(other) {
    return (
      this.package.name == other.package.name &&
      this.relation(other) == SetRelation.subset
    );
  }

  /**
   * Returns the relationship between the package versions allowed by `this`
   * and by `other`.
   *
   * Throws an `ArgumentError` if `other` doesn't refer to a package with the
   * same name as `package`.
   *
   * @param {Term} other
   * @returns {SetRelation}
   * @memberof Term
   */
  relation(other) {
    if (this.package.name != other.package.name) {
      throw new ArgumentError(
        `other, '${other}', should refer to package ${this.package.name}`,
      );
    }
    const otherConstraint = other.constraint;
    if (other.isPositive) {
      if (this.isPositive) {
        // foo from hosted is disjoint with foo from git
        if (!this._compatiblePackage(other.package)) {
          return SetRelation.disjoint;
        }
        // foo ^1.5.0 is a subset of foo ^1.0.0
        if (otherConstraint.allowsAll(this.constraint)) {
          return SetRelation.subset;
        }
        // foo ^2.0.0 is disjoint with foo ^1.0.0
        if (!this.constraint.allowsAny(otherConstraint)) {
          return SetRelation.disjoint;
        }

        // foo >=1.5.0 <3.0.0 overlaps foo ^1.0.0
        return SetRelation.overlapping;
      } else {
        // not foo from hosted is a superset foo from git
        if (!this._compatiblePackage(other.package)) {
          return SetRelation.overlapping;
        }
        // not foo ^1.0.0 is disjoint with foo ^1.5.0
        if (this.constraint.allowsAll(otherConstraint)) {
          return SetRelation.disjoint;
        }

        // not foo ^1.5.0 overlaps foo ^1.0.0
        // not foo ^2.0.0 is a superset of foo ^1.5.0
        return SetRelation.overlapping;
      }
    } else {
      if (this.isPositive) {
        // foo from hosted is a subset of not foo from git
        if (!this._compatiblePackage(other.package)) {
          return SetRelation.subset;
        }
        // foo ^2.0.0 is a subset of not foo ^1.0.0
        if (!otherConstraint.allowsAny(this.constraint)) {
          return SetRelation.subset;
        }
        // foo ^1.5.0 is disjoint with not foo ^1.0.0
        if (otherConstraint.allowsAll(this.constraint)) {
          return SetRelation.disjoint;
        }

        // foo ^1.0.0 overlaps not foo ^1.5.0
        return SetRelation.overlapping;
      } else {
        // not foo from hosted overlaps not foo from git
        if (!this._compatiblePackage(other.package)) {
          return SetRelation.overlapping;
        }
        // not foo ^1.0.0 is a subset of not foo ^1.5.0
        if (this.constraint.allowsAll(otherConstraint)) {
          return SetRelation.subset;
        }

        // not foo ^2.0.0 overlaps not foo ^1.0.0
        // not foo ^1.5.0 is a superset of not foo ^1.0.0
        return SetRelation.overlapping;
      }
    }
  }

  /**
   * Returns a `Term` that represents the packages allowed by both `this` and
   * `other`.
   *
   * If there is no such single `Term`, for example because `this` is
   * incompatible with `other`, returns `null`.
   *
   * Throws an `ArgumentError` if `other` doesn't refer to a package with the
   * same name as `package`.
   *
   * @param {Term} other
   * @returns {Term | null}
   * @memberof Term
   */
  intersect(other) {
    if (this.package.name != other.package.name) {
      throw new ArgumentError(
        `other, '${other}', should refer to package ${this.package.name}`,
      );
    }
    if (this._compatiblePackage(other.package)) {
      if (this.isPositive != other.isPositive) {
        // foo ^1.0.0 ∩ not foo ^1.5.0 → foo >=1.0.0 <1.5.0
        const positive = this.isPositive ? this : other;
        const negative = this.isPositive ? other : this;

        return this._nonEmptyTerm(
          positive.constraint.difference(negative.constraint),
          true,
        );
      } else if (this.isPositive) {
        // foo ^1.0.0 ∩ foo >=1.5.0 <3.0.0 → foo ^1.5.0
        return this._nonEmptyTerm(
          this.constraint.intersect(other.constraint),
          true,
        );
      } else {
        // not foo ^1.0.0 ∩ not foo >=1.5.0 <3.0.0 → not foo >=1.0.0 <3.0.0
        return this._nonEmptyTerm(
          this.constraint.union(other.constraint),
          false,
        );
      }
    } else if (this.isPositive != other.isPositive) {
      // foo from git ∩ not foo from hosted → foo from git
      return this.isPositive ? this : other;
    } else {
      //     foo from git ∩     foo from hosted → empty
      // not foo from git ∩ not foo from hosted → no single term
      return null;
    }
  }

  /**
   * Returns a `Term` that represents packages allowed by `this` and not by
   * `other`.
   *
   * If there is no such single `Term`, for example because all packages
   * allowed by `this` are allowed by `other`, returns `null`.
   *
   * Throws an `ArgumentError` if `other` doesn't refer to a package with the
   * same name as `package`.
   *
   * @param {Term} other
   * @returns {Term | null}
   * @memberof Term
   */
  difference(other) {
    return this.intersect(other.inverse); // A ∖ B → A ∩ not B
  }

  /**
   *  Returns whether `other` is compatible with `package`.
   *
   * @param {import('./PackageName').PackageRange} other
   * @returns {boolean}
   * @memberof Term
   */
  _compatiblePackage(other) {
    return (
      this.package.isRoot || other.isRoot || other.samePackage(this.package)
    );
  }

  /**
   * Returns a new `Term` with the same package as `this` and with
   * `constraint`, unless that would produce a term that allows no packages,
   * in which case this returns `null`.
   *
   * @param {import('./Version').VersionConstraint} constraint
   * @param {boolean} isPositive
   * @returns {Term | null}
   * @memberof Term
   */
  _nonEmptyTerm(constraint, isPositive) {
    return constraint.isEmpty
      ? null
      : new Term(this.package.withConstraint(constraint), isPositive);
  }

  /**
   * @returns {string}
   * @memberof Term
   */
  toString() {
    return `${this.isPositive ? "" : "not "}${this.package}`;
  }
}
module.exports.Term = Term;
