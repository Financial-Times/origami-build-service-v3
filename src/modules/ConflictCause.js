"use strict";

/**
 * The incompatibility was derived from two existing incompatibilities during conflict resolution.
 *
 * @class ConflictCause
 */
class ConflictCause {
  /**
   * Creates an instance of ConflictCause.
   * @param {import('./Incompatibility').Incompatibility} conflict
   * @param {import('./Incompatibility').Incompatibility} other
   * @memberof ConflictCause
   */
  constructor(conflict, other) {
    this.conflict = conflict;
    this.other = other;
  }
}
module.exports.ConflictCause = ConflictCause;
