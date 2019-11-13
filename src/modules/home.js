"use strict";

const fs = require("fs").promises;
const { is } = require("immutable");
const path = require("path");
const log = require("./log");

/**
 * Creates a new symlink that creates an alias at `symlink` that points to the
 * `target`.
 *
 * If `relative` is true, creates a symlink with a relative path from the
 * symlink to the target. Otherwise, uses the `target` path unmodified.
 *
 * @param {string} name
 * @param {string} target
 * @param {string} symlink
 */
const createPackageSymlink = async (name, target, symlink) => {
  log(`Creating link for package '${name}'. From ${symlink}, to ${target}.`);
  await fs.mkdir(path.parse(symlink).dir, { recursive: true });
  await fs.symlink(target, symlink);
};

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

module.exports.createPackageSymlink = createPackageSymlink;
module.exports.equalsWithoutPreRelease = equalsWithoutPreRelease;
