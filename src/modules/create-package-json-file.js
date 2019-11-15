"use strict";

const fs = require("fs").promises;
const path = require("path");
const { FormatError } = require("./errors");
const { VersionConstraint } = require("./version");

/**
 * Creates a package.json file within `bundleLocation` with the `modules` as the dependencies.
 * @param {string} bundleLocation
 * @param {import("immutable").Map<string, string>} modules
 * @returns {Promise<void>}
 */
module.exports = async function createPackageJsonFile(bundleLocation, modules) {
  const errors = [];
  modules.reduce(function reducer(reduction, value, key) {
    try {
      VersionConstraint.parse(value);
    } catch (e) {
      if (e instanceof FormatError) {
        reduction.push(
          `The version ${value} in ${key}@${value} is not a valid version.`,
        );
      }
    }

    return reduction;
  }, errors);

  if (errors.length > 0) {
    throw new FormatError(
      errors.join("\n") +
        "\n" +
        "Please refer to TODO (build service documentation) for what is a valid version.",
    );
  }

  await fs.writeFile(
    path.join(bundleLocation, "./package.json"),
    JSON.stringify({
      dependencies: modules,
      name: "your bundle",
      version: "1.0.0",
    }),
    "utf-8",
  );
};
