"use strict";

/**
 * Returns whether `version1` is the same as `version2`, ignoring their prereleases.
 * @param {import('./version').Version} version1
 * @param {import('./version').Version} version2
 * @returns {boolean}
 */
const versionsEqualWithoutPrerelease = (version1, version2) =>
  version1.major === version2.major &&
  version1.minor === version2.minor &&
  version1.patch === version2.patch;

module.exports.versionsEqualWithoutPrerelease = versionsEqualWithoutPrerelease;
