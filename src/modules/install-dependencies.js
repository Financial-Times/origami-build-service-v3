"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs").promises;
const { Entrypoint } = require("./entrypoint");
const { SystemCache } = require("./system-cache");

/**
 * Installs the dependencies for the package.json file locatde at `location`
 * Uses the PubGrub algorithm for the version solving.
 *
 * @param {String} location
 * @returns {Promise<void>}
 */
module.exports = async function installDependencies(
  location,
  systemCacheDirectory = path.join(os.tmpdir(), "pubgrub-cache"),
) {
  await fs.mkdir(systemCacheDirectory, { recursive: true });
  const systemcache = new SystemCache(systemCacheDirectory);

  const entrypoint = new Entrypoint(location, systemcache);
  await entrypoint.acquireDependencies();
};
