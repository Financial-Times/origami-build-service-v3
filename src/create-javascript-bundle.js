"use strict";

import { promises as fs } from "fs";
import { createEntryFile } from "./create-entry-file-js";
import { parseModulesParameter } from "./parse-modules-parameter";
import * as util from "util";
import * as rimraf from "rimraf";
import { createPackageJsonFile } from "./modules/create-package-json-file";
import { installDependencies } from "./modules/install-dependencies";
import { createJavaScriptBundle } from "./modules/bundle-javascript";
import { SolveFailure } from "./modules/solve-failure";
import {
  UserError,
  FormatError,
  PackageNotFoundError,
  ApplicationError,
  ManifestError,
} from "./modules/errors";
const rmrf = util.promisify(rimraf);

const jsBundle = async (querystring = {}) => {
  await fs.mkdir("/tmp/bundle/", { recursive: true });
  const bundleLocation = await fs.mkdtemp("/tmp/bundle/");

  try {
    const modules = parseModulesParameter(querystring && querystring.modules);

    await createPackageJsonFile(bundleLocation, modules);

    await installDependencies(bundleLocation);

    await createEntryFile(bundleLocation, modules);

    const bundle = await createJavaScriptBundle(bundleLocation);

    return {
      body: bundle,
      statusCode: 200,
      headers: {
        "Content-Type": "application/javascript;charset=UTF-8",
        "Cache-Control":
          "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
      },
    };
  } catch (err) {
    console.error(JSON.stringify(err));
    if (
      err instanceof SolveFailure ||
      err instanceof UserError ||
      err instanceof FormatError ||
      err instanceof PackageNotFoundError ||
      err instanceof ApplicationError ||
      err instanceof ManifestError
    ) {
      return {
        body: `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: " + err.message,
        )})`,
        statusCode: 200,
        headers: {
          "Content-Type": "application/javascript;charset=UTF-8",
          "Cache-Control": "max-age=0, must-revalidate, no-cache, no-store",
        },
      };
    } else {
      throw err;
    }
  } finally {
    await rmrf(bundleLocation);
  }
};

export { jsBundle };
