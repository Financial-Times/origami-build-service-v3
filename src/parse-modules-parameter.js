"use strict";

import { Map } from "immutable";
import validateNpmPackageName from "validate-npm-package-name";
import { UserError } from "./modules/errors";

/**
 * Used to ensure all module names in the modules query parameter conform to the package.json specification.
 * https://docs.npmjs.com/files/package.json#name
 *
 * If all module names are valid, return a Map of module name to version range.
 * If any module names are not valid, return an Error HTTP 400 status code, specifying which module names are invalid.
 *
 * @param {string} modules
 * @throws {import('./modules/errors').UserError}
 * @returns {import("immutable").Map<string, string>}
 */
export const parseModulesParameter = modules => {
  if (modules) {
    // Turn string value into an array and remove any empty items.
    const parsedModules = modules.split(",").filter(m => m !== "");

    if (modules.length === 0) {
      const error = new UserError(
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
      const error = new UserError(
        `The modules query parameter contains module names which are not valid: ${invalidModuleNames.join(
          ", ",
        )}.`,
      );
      // @ts-ignore
      error.code = 400;
      throw error;
    } else {
      if (moduleNames.length === 0) {
        const error = new UserError(
          "The modules query parameter can not be empty.",
        );
        // @ts-ignore
        error.code = 400;
        throw error;
      } else if (moduleNames.length !== new Set(moduleNames).size) {
        const error = new UserError(
          `The modules query parameter contains duplicate module names.`,
        );
        // @ts-ignore
        error.code = 400;
        throw error;
      } else {
        const m = Map(
          parsedModules.map(module => {
            if (!(module.lastIndexOf("@") > 0)) {
              const error = new UserError(
                `The bundle request contains ${module} with no version range, a version range is required.\nPlease refer to TODO (build service documentation) for what is a valid version.`,
              );
              // @ts-ignore
              error.code = 400;
              throw error;
            }

            return [
              module.substr(0, module.lastIndexOf("@")),
              module.substr(module.lastIndexOf("@") + 1),
            ];
          }),
        );

        return m;
      }
    }
  } else {
    const error = new UserError("The modules query parameter is required.");
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
