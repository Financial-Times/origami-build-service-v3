"use strict";

import * as path from "path";
import * as os from "os";
import { promises as fs } from "fs";
import { acquireDependencies } from "./acquire-dependencies";
import { SystemCache } from "./system-cache";

/**
 * Installs the dependencies for the package.json file locatde at `location`
 * Uses the PubGrub algorithm for the version solving.
 *
 * @param {String} location
 * @returns {Promise<void>}
 */
export async function installDependencies(
  location,
  systemCacheDirectory = path.join(os.tmpdir(), "pubgrub-cache"),
) {
  await fs.mkdir(systemCacheDirectory, { recursive: true });
  const systemcache = new SystemCache(systemCacheDirectory);

  await acquireDependencies(location, systemcache);
}
