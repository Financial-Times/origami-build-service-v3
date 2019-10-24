"use strict";

const polyfill = require("array.prototype.flatmap");
polyfill.shim();
const execa = require("execa");
const fs = require("fs").promises;
const path = require("path");
const { createEntryFile } = require("./create-entry-file-js");
const { parseModulesParameter } = require("./parse-modules-parameter");
const { Entrypoint } = require("./modules/Entrypoint");
const { GET } = require("./modules/SolveType");
const { SystemCache } = require("./modules/SystemCache");
const util = require("util");
const rimraf = require("rimraf");
const rmrf = util.promisify(rimraf);

console.clear();
const jsBundle = async (querystring = {}) => {
  await fs.mkdir("/tmp/bundle/", { recursive: true });
  const bundleLocation = await fs.mkdtemp("/tmp/bundle/");

  try {
    await rmrf(`/Users/jake.champion/.jake-cache`);
    const modules = parseModulesParameter(querystring && querystring.modules);
    await fs.writeFile(
      path.join(bundleLocation, "./package.json"),
      JSON.stringify({
        dependencies: modules,
        name: "o-jake",
        version: "1.0.0",
      }),
      "utf-8",
    );
    const systemcache = new SystemCache();
    const entrypoint = new Entrypoint(bundleLocation, systemcache);
    await entrypoint.acquireDependencies(GET);
    await createEntryFile(bundleLocation, modules);

    const { stdout: bundle } = await execa.command(`px ${bundleLocation}`, {
      shell: true,
    });

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
