"use strict";

const { is } = require("immutable");

/**
 * Returns whether `version1` is the same as `version2`, ignoring their prereleases.
 * @param {import('./version').Version} version1
 * @param {import('./version').Version} version2
 * @returns {boolean}
 */
const equalsWithoutPreRelease = (version1, version2) =>
  is(version1.major, version2.major) &&
  is(version1.minor, version2.minor) &&
  is(version1.patch, version2.patch);

module.exports.equalsWithoutPreRelease = equalsWithoutPreRelease;
