const { createEntryFile } = require("./create-entry-file-js");
const { parseModulesParameter } = require("./parse-modules-parameter");
const util = require("util");
const rimraf = require("rimraf");
const rmrf = util.promisify(rimraf);
const createPackageJsonFile = require("./modules/create-package-json-file");
const installDependencies = require("./modules/install-dependencies");
const createJavaScriptBundle = require("./modules/bundle-javascript");
const { SolveFailure } = require("./modules/solve-failure");
const {
  UserError,
  FormatError,
  PackageNotFoundError,
  ApplicationError,
} = require("./modules/errors");

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
      err instanceof PackageNotFoundError
    ) {
      return {
        body: `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: " + err.message,
        )})`,
        statusCode: 400,
        headers: {
          "Content-Type": "application/javascript;charset=UTF-8",
          "Cache-Control": "max-age=0, must-revalidate, no-cache, no-store",
        },
      };
    } else if (err instanceof ApplicationError) {
      return {
        body: `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: " + err.message,
        )})`,
        statusCode: 500,
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

module.exports = { jsBundle };
