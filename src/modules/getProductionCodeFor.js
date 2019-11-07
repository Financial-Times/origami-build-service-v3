"use strict";

const execa = require("execa");
const decompress = require("decompress");
const fs = require("fs").promises;
const os = require("os");
const path = require("path");
const rimraf = require("rimraf");
const { promisify } = require("util");
const rmrf = promisify(rimraf);
const tar = require("tar");

module.exports = getProductionCodeFor;

/**
 * Fetches the tarball for the version from GitHub.
 * Unpacks the tarball.
 * Removes the docs/test/demos/resources/examples/img folders.
 * Creates and returns a new tarball of the folders and files that are left.
 *
 * @param {string} name The name of the component.
 * @param {string} version The version of the component whose code you want.
 * @returns {Promise<Buffer>} Buffer which contains a gzipped tarball of the code.
 */
async function getProductionCodeFor(name, version) {
  const { stdout } = await execa.command(`npm pack ${name}@'${version}'`, {
    shell: true,
  });

  const buf = await fs.readFile(stdout);

  return buf;
}
