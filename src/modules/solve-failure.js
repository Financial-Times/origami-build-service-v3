"use strict";

const assert = require("assert");
const { Map } = require("immutable");
const { ConflictCause } = require("./conflict-cause");
const { ApplicationError } = require("./home");
const { PackageDetail } = require("./package-detail");
const { PackageNotFoundCause } = require("./package-not-found-cause");
const { Pair } = require("./pair");

/**
 * An error indicating that version solving failed.
 *
 * @class SolveFailure
 * @extends {ApplicationError}
 */
class SolveFailure extends ApplicationError {
  /**
   * Creates an instance of SolveFailure.
   * @param {import('./incompatibility').Incompatibility} incompatibility
   * @memberof SolveFailure
   */
  constructor(incompatibility) {
    super();
    assert(incompatibility.terms[0].package.isRoot());
    this.incompatibility = incompatibility;
  }

  /**
   *
   * @type {string}
   * @readonly
   * @memberof SolveFailure
   */
  get message() {
    return this.toString();
  }
  /**
   * Returns a `PackageNotFoundError` that (transitively) caused this
   * failure, or `null` if it wasn't caused by a `PackageNotFoundError`.
   *
   * If multiple `PackageNotFoundError`s caused the error, it's undefined
   * which one is returned.
   *
   * @type {import('./home').PackageNotFoundError | null}
   * @memberof SolveFailure
   */
  get packageNotFound() {
    for (const incompatibility of this.incompatibility.externalIncompatibilities()) {
      const cause = incompatibility.cause;
      if (cause instanceof PackageNotFoundCause) {
        return cause.error;
      }
    }

    return null;
  }

  /**
   * Describes how `incompatibility` was derived, and thus why version solving failed.
   *
   * @returns {string}
   * @memberof SolveFailure
   */
  toString() {
    return new _Writer(this.incompatibility).write();
  }
}

/**
 * A class that writes a human-readable description of the cause of a
 * `SolveFailure`.
 *
 * See https://github.com/dart-lang/pub/tree/master/doc/solver.md#error-reporting
 * for details on how this algorithm works.
 *
 * @class _Writer
 */
class _Writer {
  /**
   * Creates an instance of _Writer.
   * @param {import('./incompatibility').Incompatibility} _root
   * @memberof _Writer
   */
  constructor(_root) {
    /**
     * The number of times each [Incompatibility] appears in [_root]'s derivation
     * tree.
     *
     * When an [Incompatibility] is used in multiple derivations, we need to give
     * it a number so we can refer back to it later on.
     * @type {import('immutable').Map<import('./incompatibility').Incompatibility, number>}
     */
    this._derivations = Map();

    /**
     * A map from incompatibilities to the line numbers that were written for
     * those incompatibilities.
     * @type {import('immutable').Map<import('./incompatibility').Incompatibility, number>}
     */
    this._lineNumbers = Map();

    /**
     * The lines in the proof.
     * Each line is a message/number pair. The message describes a single
     * incompatibility, and why its terms are incompatible. The number is
     * optional and indicates the explicit number that should be associated with
     * the line so it can be referred to later on.
     * @type {Array<import('./pair').Pair<string, number | null>>}
     */
    this._lines = [];
    this._root = _root;
    this._countDerivations(_root);
  }

  /**
   * Populates `_derivations` for `incompatibility` and its transitive causes.
   *
   * @param {import('./incompatibility').Incompatibility} incompatibility
   * @memberof _Writer
   */
  _countDerivations(incompatibility) {
    if (this._derivations.has(incompatibility)) {
      this._derivations = this._derivations.set(
        incompatibility,
        this._derivations.get(incompatibility, 1) + 1,
      );
    } else {
      this._derivations = this._derivations.set(incompatibility, 1);
      const cause = incompatibility.cause;
      if (cause instanceof ConflictCause) {
        this._countDerivations(cause.conflict);
        this._countDerivations(cause.other);
      }
    }
  }

  write() {
    let buffer = "";
    const wroteLine = false;
    if (wroteLine) {
      buffer += "\n";
    }
    if (this._root.cause instanceof ConflictCause) {
      this._visit(this._root, Map());
    } else {
      this._write(this._root, `Because ${this._root}, version solving failed.`);
    }
    // Only add line numbers if the derivation actually needs to refer to a line
    // by number.
    const padding = this._lineNumbers.isEmpty()()
      ? 0
      : `(${this._lineNumbers.valueSeq().last()}) `.length;
    let lastWasEmpty = false;
    for (const line of this._lines) {
      let message = line.first;
      if (message.length == 0) {
        if (!lastWasEmpty) {
          buffer += "\n";
        }
        lastWasEmpty = true;
        continue;
      } else {
        lastWasEmpty = false;
      }
      const number = line.last;
      if (number != null) {
        message = `(${number})`.padEnd(padding) + message;
      } else {
        message = " ".repeat(padding) + message;
      }
      buffer += message + "\n";
    }

    return buffer.toString();
  }

  /**
   * Writes `message` to `_lines`.
   *
   * The `message` should describe `incompatibility` and how it was derived (if
   * applicable). If `numbered` is true, this will associate a line number with
   * `incompatibility` and `message` so that the message can be easily referred
   * to later.
   *
   * @param {import('./incompatibility').Incompatibility} incompatibility
   * @param {string} message
   * @param {boolean} [numbered=false]
   * @memberof _Writer
   */
  _write(incompatibility, message, numbered = false) {
    if (numbered) {
      const number = this._lineNumbers.size + 1;
      this._lineNumbers = this._lineNumbers.set(incompatibility, number);
      this._lines.push(new Pair(message, number));
    } else {
      this._lines.push(new Pair(message, null));
    }
  }

  /**
   * Writes a proof of `incompatibility` to `_lines`.
   *
   * If `conclusion` is `true`, `incompatibility` represents the last of a
   * linear series of derivations. It should be phrased accordingly and given a
   * line number.
   *
   * The `detailsForIncompatibility` controls the amount of detail that should
   * be written for each package when converting `incompatibility` to a string.
   *
   * * @param {import('./incompatibility').Incompatibility} incompatibility
   * @param {import('immutable').Map<string, import('./package-detail').PackageDetail>} detailsForIncompatibility
   * @param {boolean} [conclusion=false]
   * @memberof _Writer
   */
  _visit(incompatibility, detailsForIncompatibility, conclusion = false) {
    // Add explicit numbers for incompatibilities that are written far away
    // from their successors or that are used for multiple derivations.
    const numbered =
      conclusion || this._derivations.get(incompatibility, 0) > 1;
    const conjunction =
      conclusion || incompatibility == this._root ? "So," : "And";
    const incompatibilityString = incompatibility.toString(
      detailsForIncompatibility,
    );
    const cause = incompatibility.cause;
    let detailsForCause = this._detailsForCause(cause);
    if (
      cause.conflict.cause instanceof ConflictCause &&
      cause.other.cause instanceof ConflictCause
    ) {
      const conflictLine = this._lineNumbers.get(cause.conflict);
      const otherLine = this._lineNumbers.get(cause.other);
      if (conflictLine != null && otherLine != null) {
        this._write(
          incompatibility,
          "Because " +
            cause.conflict.andToString(
              cause.other,
              detailsForCause,
              conflictLine,
              otherLine,
            ) +
            `, ${incompatibilityString}.`,
          numbered,
        );
      } else if (conflictLine != null || otherLine != null) {
        let withLine;
        let withoutLine;
        let line;
        if (conflictLine != null) {
          withLine = cause.conflict;
          withoutLine = cause.other;
          line = conflictLine;
        } else {
          withLine = cause.other;
          withoutLine = cause.conflict;
          line = otherLine;
        }
        this._visit(withoutLine, detailsForCause);
        this._write(
          incompatibility,
          `${conjunction} because ${withLine.toString(
            detailsForCause,
          )} (${line}), ${incompatibilityString}.`,
          numbered,
        );
      } else {
        const singleLineConflict = this._isSingleLine(cause.conflict.cause);
        const singleLineOther = this._isSingleLine(cause.other.cause);
        if (singleLineOther || singleLineConflict) {
          const first = singleLineOther ? cause.conflict : cause.other;
          const second = singleLineOther ? cause.other : cause.conflict;
          this._visit(first, detailsForCause);
          this._visit(second, detailsForCause);
          this._write(
            incompatibility,
            `Thus, ${incompatibilityString}.`,
            numbered,
          );
        } else {
          this._visit(cause.conflict, Map(), true);
          this._lines.push(new Pair("", null));
          this._visit(cause.other, detailsForCause);
          this._write(
            incompatibility,
            `${conjunction} because ${cause.conflict.toString(
              detailsForCause,
            )} (${this._lineNumbers.get(
              cause.conflict,
            )}), ${incompatibilityString}.`,
            numbered,
          );
        }
      }
    } else if (
      cause.conflict.cause instanceof ConflictCause ||
      cause.other.cause instanceof ConflictCause
    ) {
      const derived =
        cause.conflict.cause instanceof ConflictCause
          ? cause.conflict
          : cause.other;
      const ext =
        cause.conflict.cause instanceof ConflictCause
          ? cause.other
          : cause.conflict;
      const derivedLine = this._lineNumbers.get(derived);
      if (derivedLine != null) {
        this._write(
          incompatibility,
          "Because " +
            ext.andToString(derived, detailsForCause, undefined, derivedLine) +
            `, ${incompatibilityString}.`,
          numbered,
        );
      } else if (this._isCollapsible(derived)) {
        const derivedCause = derived.cause;
        const collapsedDerived =
          derivedCause.conflict.cause instanceof ConflictCause
            ? derivedCause.conflict
            : derivedCause.other;
        const collapsedExt =
          derivedCause.conflict.cause instanceof ConflictCause
            ? derivedCause.other
            : derivedCause.conflict;
        detailsForCause = detailsForCause.mergeWith(
          (detail1, detail2) => detail1.max(detail2),
          this._detailsForCause(derivedCause),
        );
        this._visit(collapsedDerived, detailsForCause);
        this._write(
          incompatibility,
          `${conjunction} because ${collapsedExt.andToString(
            ext,
            detailsForCause,
          )}, ${incompatibilityString}.`,
          numbered,
        );
      } else {
        this._visit(derived, detailsForCause);
        this._write(
          incompatibility,
          `${conjunction} because ${ext.toString(
            detailsForCause,
          )}, ${incompatibilityString}.`,
          numbered,
        );
      }
    } else {
      this._write(
        incompatibility,
        `Because ${cause.conflict.andToString(
          cause.other,
          detailsForCause,
        )}, ${incompatibilityString}.`,
        numbered,
      );
    }
  }

  /**
   * Returns whether we can collapse the derivation of `incompatibility`.
   *
   * If `incompatibility` is only used to derive one other incompatibility,
   * it may make sense to skip that derivation and just derive the second
   * incompatibility directly from three causes. This is usually clear enough
   * to the user, and makes the proof much terser.
   *
   * For example, instead of writing
   *
   *     ... foo ^1.0.0 requires bar ^1.0.0.
   *     And, because bar ^1.0.0 depends on baz ^1.0.0, foo ^1.0.0 requires
   *       baz ^1.0.0.
   *     And, because baz ^1.0.0 depends on qux ^1.0.0, foo ^1.0.0 requires
   *       qux ^1.0.0.
   *     ...
   *
   * we collapse the two derivations into a single line and write
   *
   *     ... foo ^1.0.0 requires bar ^1.0.0.
   *     And, because bar ^1.0.0 depends on baz ^1.0.0 which depends on
   *       qux ^1.0.0, foo ^1.0.0 requires qux ^1.0.0.
   *     ...
   *
   * If this returns `true`, `incompatibility` has one external predecessor
   * and one derived predecessor.
   *
   * * @param {import('./incompatibility').Incompatibility} incompatibility
   * @returns {boolean}
   * @memberof _Writer
   */
  _isCollapsible(incompatibility) {
    // If `incompatibility` is used for multiple derivations, it will need a
    // line number and so will need to be written explicitly.
    if (this._derivations.get(incompatibility, 0) > 1) {
      return false;
    }
    const cause = incompatibility.cause;
    // If `incompatibility` is derived from two derived incompatibilities,
    // there are too many transitive causes to display concisely.
    if (
      cause.conflict.cause instanceof ConflictCause &&
      cause.other.cause instanceof ConflictCause
    ) {
      return false;
    }
    // If `incompatibility` is derived from two external incompatibilities, it
    // tends to be confusing to collapse it.
    if (
      !(cause.conflict.cause instanceof ConflictCause) &&
      !(cause.other.cause instanceof ConflictCause)
    ) {
      return false;
    }
    // If `incompatibility`'s internal cause is numbered, collapsing it would
    // get too noisy.
    const complex =
      cause.conflict.cause instanceof ConflictCause
        ? cause.conflict
        : cause.other;

    return !this._lineNumbers.has(complex);
  }

  /**
   * Returns whether or not `cause`'s incompatibility can be represented in a
   * single line without requiring a multi-line derivation.
   *
   * @param {import('./conflict-cause').ConflictCause} cause
   * @returns {boolean}
   * @memberof _Writer
   */
  _isSingleLine(cause) {
    return (
      !(cause.conflict.cause instanceof ConflictCause) &&
      !(cause.other.cause instanceof ConflictCause)
    );
  }

  /**
   * Returns the amount of detail needed for each package to accurately
   * describe `cause`.
   *
   * If the same package name appears in both of `cause`'s incompatibilities
   * but each has a different source, those incompatibilities should explicitly
   * print their sources, and similarly for differing descriptions.
   *
   * @param {import('./conflict-cause').ConflictCause} cause
   * @returns {import('immutable').Map<string, import('./package-detail').PackageDetail>}
   * @memberof _Writer
   */
  _detailsForCause(cause) {
    let conflictPackages = Map();
    for (const term of cause.conflict.terms) {
      if (term.package.isRoot()) {
        continue;
      }
      conflictPackages = conflictPackages.set(term.package.name, term.package);
    }
    let details = Map();
    for (const term of cause.other.terms) {
      const conflictPackage = conflictPackages.get(term.package.name);
      if (term.package.isRoot()) {
        continue;
      }
      if (conflictPackage == null) {
        continue;
      }
      if (conflictPackage.source != term.package.source) {
        details = details.set(
          term.package.name,
          new PackageDetail(false, true),
        );
      } else if (!conflictPackage.samePackage(term.package)) {
        details = details.set(
          term.package.name,
          new PackageDetail(false, true, true),
        );
      }
    }

    return details;
  }
}

module.exports.SolveFailure = SolveFailure;
