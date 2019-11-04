"use strict";

const fs = require("fs").promises;
const path = require("path");

/**
 * Creates a package.json file within `bundleLocation` with the `modules` as the dependencies.
 * @param {string} bundleLocation
 * @param {import("immutable").Map<string, string>} modules
 * @returns {Promise<void>}
 */
module.exports = async function createPackageJsonFile(bundleLocation, modules) {
  await fs.writeFile(
    path.join(bundleLocation, "./package.json"),
    JSON.stringify({
      dependencies: modules,
      name: "o-bundle",
      version: "1.0.0",
    }),
    "utf-8",
  );
};
