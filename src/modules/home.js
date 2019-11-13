"use strict";

const directoryExists = require("directory-exists");
const fs = require("fs").promises;
const { is } = require("immutable");
const path = require("path");
const process = require("process");
const log = require("./log");

/**
 * Returns whether `dir` exists on the file system.
 *
 * This returns `true` for a symlink only if that symlink is unbroken and
 * points to a directory.
 *
 * @param {string} dir
 * @returns {Promise<boolean>}
 */
const dirExists = async dir => {
  return directoryExists(dir);
};

/**
 * Creates a new symlink at path `symlink` that points to `target`.
 *
 * Returns a `Future` which completes to the path to the symlink file.
 *
 * If `relative` is true, creates a symlink with a relative path from the
 * symlink to the target. Otherwise, uses the `target` path unmodified.
 *
 * Note that on Windows, only directories may be symlinked to.
 *
 * @param {string} target
 * @param {string} symlink
 * @param {boolean} [relative]
 */
const createSymlink = async (target, symlink, relative = false) => {
  if (relative) {
    // If the directory where we're creating the symlink was itself reached
    // by traversing a symlink, we want the relative path to be relative to
    // it's actual location, not the one we went through to get to it.
    const symlinkDir = path.join(process.cwd(), path.dirname(symlink));
    target = path.normalize(path.relative(symlinkDir, target));
  }
  log(`Creating ${symlink} pointing to ${target}`);
  await fs.symlink(target, symlink);
};

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
 * @param {boolean} [isSelfLink]
 * @param {boolean} [relative]
 */
const createPackageSymlink = async (
  name,
  target,
  symlink,
  isSelfLink = false,
  relative = false,
) => {
  log(
    `Creating ${
      isSelfLink ? "self" : ""
    }link for package '${name}'. From ${symlink}, to ${target}.`,
  );
  await fs.mkdir(path.parse(symlink).dir, { recursive: true });
  await createSymlink(target, symlink, relative);
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

module.exports.dirExists = dirExists;
module.exports.createPackageSymlink = createPackageSymlink;
module.exports.equalsWithoutPreRelease = equalsWithoutPreRelease;
