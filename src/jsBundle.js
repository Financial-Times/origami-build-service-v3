"use strict";

const polyfill = require("array.prototype.flatmap");
polyfill.shim();
const fs = require("fs").promises;
const { createEntryFile } = require("./create-entry-file-js");
const { parseModulesParameter } = require("./parse-modules-parameter");
const util = require("util");
const rimraf = require("rimraf");
const rmrf = util.promisify(rimraf);
const createPackageJsonFile = require("./modules/create-package-json-file");
const installDependencies = require("./modules/install-dependencies");
const createJavaScriptBundle = require("./modules/create-javascript-bundle");

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
      },
    };
  } finally {
    await rmrf(bundleLocation);
  }
};
module.exports = { jsBundle };
