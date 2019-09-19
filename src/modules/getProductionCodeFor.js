"use strict";

const axios = require("axios");
const decompress = require("decompress");
const fs = require("fs");
const os = require("os");
const path = require("path");
const rimraf = require("rimraf");
const { promisify } = require("util");
const rmrf = promisify(rimraf);
const tar = require("tar");
const log = require("./log");
const mkdtemp = promisify(fs.mkdtemp);
const readFile = promisify(fs.readFile);

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
  const urlWithV = `https://codeload.github.com/Financial-Times/${name}/legacy.tar.gz/v${version}`;
  const urlWithoutV = `https://codeload.github.com/Financial-Times/${name}/legacy.tar.gz/${version}`;
  let response;
  try {
    log(`Downloading ${urlWithV}`);
    // @ts-ignore This expression is not callable.
    response = await axios({
      method: "get",
      url: urlWithV,
      responseType: "arraybuffer"
    });
  } catch (err) {
    log(`Failed to fetch ${urlWithV}. Error: ${err.toString()}`);
    log(`Downloading ${urlWithoutV}`);
    // @ts-ignore This expression is not callable.
    response = await axios({
      method: "get",
      url: urlWithoutV,
      responseType: "arraybuffer"
    });
  }
  log(`response size is ${Buffer.from(response.data).length}`);
  const folder = await mkdtemp(path.join(os.tmpdir(), `${name}@v${version}`));
  await decompress(Buffer.from(response.data), folder, {
    strip: 1
  });

  // Removing all folders which are not used during production use of the components.
  await rmrf(`${folder}/docs`);
  await rmrf(`${folder}/test`);
  await rmrf(`${folder}/demos`);
  await rmrf(`${folder}/resources`);
  await rmrf(`${folder}/examples`);
  // o-grid had very large files in the img folder which are not used.
  if (name === "o-grid") {
    await rmrf(`${folder}/img`);
  }

  const tarFolder = await mkdtemp(
    path.join(os.tmpdir(), `${name}@v${version}-tar`)
  );
  const tarPath = path.join(tarFolder, "my-tarball.tgz");
  await tar.c(
    {
      file: tarPath,
      gzip: {
        level: 9
      }
    },
    [folder]
  );
  const buf = await readFile(tarPath);
  log(`new code size is ${buf.byteLength}`);
  return buf;
}
