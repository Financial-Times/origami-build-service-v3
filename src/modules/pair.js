"use strict";

const { hash, is } = require("immutable");
/**
 * A pair of values.
 * @template F
 * @template L
 * @class Pair
 */
class Pair {
  /**
   * Creates an instance of Pair.
   * @param {F} first
   * @param {L} last
   * @memberof Pair
   */
  constructor(first, last) {
    this.first = first;
    this.last = last;
  }

  /**
   * @returns {string}
   * @memberof Pair
   */
  toString() {
    return `(${String(this.first)}, ${String(this.last)})'`;
  }

  /**
   * @param {*} other
   * @returns {boolean}
   * @memberof Pair
   */
  equals(other) {
    if (!(other instanceof Pair)) {
      return false;
    }

    return is(other.first, this.first) && is(other.last, this.last);
  }

  /**
   * @returns {number}
   * @memberof Pair
   */
  hashCode() {
    return hash(this.first) ^ hash(this.last);
  }
}
module.exports.Pair = Pair;
