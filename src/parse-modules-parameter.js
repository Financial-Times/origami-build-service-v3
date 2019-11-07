"use strict";

const { Map } = require("immutable");
const validateNpmPackageName = require("validate-npm-package-name");
const { UserException } = require("./modules/HOME");

/**
 * Used to ensure all module names in the modules query parameter conform to the package.json specification.
 * https://docs.npmjs.com/files/package.json#name
 *
 * If all module names are valid, return a Map of module name to version range.
 * If any module names are not valid, return an Error HTTP 400 status code, specifying which module names are invalid.
 *
 * @param {string} modules
 * @returns {import("immutable").Map<string, string>}
 */
module.exports.parseModulesParameter = modules => {
  if (modules) {
    // Turn string value into an array and remove any empty items.
    const parsedModules = modules.split(",").filter(m => m !== "");

    if (modules.length === 0) {
      const error = new UserException(
        "The modules query parameter can not be empty.",
      );
      // @ts-ignore
      error.code = 400;
      throw error;
    }

    const moduleNames = parsedModules.map(mod => {
      if (mod.startsWith("@")) {
        return "@" + mod.split("@")[1];
      } else {
        return mod.split("@")[0];
      }
    });

    const invalidModuleNames = moduleNames.filter(
      name => !isValidNpmModuleName(name),
    );

    if (invalidModuleNames.length > 0) {
      const error = new UserException(
        `The modules query parameter contains module names which are not valid: ${invalidModuleNames.join(
          ", ",
        )}.`,
      );
      // @ts-ignore
      error.code = 400;
      throw error;
    } else {
      if (moduleNames.length === 0) {
        const error = new UserException(
          "The modules query parameter can not be empty.",
        );
        // @ts-ignore
        error.code = 400;
        throw error;
      } else if (moduleNames.length !== new Set(moduleNames).size) {
        const error = new UserException(
          `The modules query parameter contains duplicate module names.`,
        );
        // @ts-ignore
        error.code = 400;
        throw error;
      } else {
        const m = Map(
          parsedModules.map(module =>
            module.lastIndexOf("@") > 0
              ? [
                  module.substr(0, module.lastIndexOf("@")),
                  module.substr(module.lastIndexOf("@") + 1),
                ]
              : module.split("@"),
          ),
        );

        return m;
      }
    }
  } else {
    const error = new UserException("The modules query parameter is required.");
    // @ts-ignore
    error.code = 400;
    throw error;
  }
};

/**
 * Checks an npm module name conforms to the package.json specification.
 * @param {String} name An npm module name.
 * @returns {Boolean} Whether the name parameter is valid according to package.json specification.
 */
function isValidNpmModuleName(name) {
  return validateNpmPackageName(name).validForNewPackages;
}
