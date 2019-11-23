"use strict";

/**
 * The incompatibility was derived from two existing incompatibilities during conflict resolution.
 *
 * @class ConflictCause
 */
export class ConflictCause {
  /**
   * Creates an instance of ConflictCause.
   * @param {import('./incompatibility').Incompatibility} conflict
   * @param {import('./incompatibility').Incompatibility} other
   * @memberof ConflictCause
   */
  constructor(conflict, other) {
    this.conflict = conflict;
    this.other = other;
  }
}
