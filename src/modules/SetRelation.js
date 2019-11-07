"use strict";

/**
 * An enum of possible relationships between two sets.
 * @class SetRelation
 */
class SetRelation {
  /**
   * Creates an instance of SetRelation.
   * @param {string} _name
   * @memberof SetRelation
   */
  constructor(_name) {
    this._name = _name;
  }

  /**
   * @returns {string}
   * @memberof SetRelation
   */
  toString() {
    return this._name;
  }
}

/**
 * The second set contains all elements of the first, as well as possibly more.
 * @type {SetRelation}
 * @static
 * @memberof SetRelation
 */
SetRelation.subset = new SetRelation("subset");

/**
 * Neither set contains any elements of the other.
 * @type {SetRelation}
 * @static
 * @memberof SetRelation
 */
SetRelation.disjoint = new SetRelation("disjoint");
/**
 * The sets have elements in common, but the first is not a superset of the
 * second.
 *
 * This is also used when the first set is a superset of the first, but in
 * practice we don't need to distinguish that from overlapping sets.
 * @type {SetRelation}
 * @static
 * @memberof SetRelation
 */
SetRelation.overlapping = new SetRelation("overlapping");

module.exports.SetRelation = SetRelation;
