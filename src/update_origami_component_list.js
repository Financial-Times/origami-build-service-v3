"use strict";

const getAllComponentsAndVersions = require("./modules/getAllComponentsAndVersions");
const getProductionCodeFor = require("./modules/getProductionCodeFor");
const { ManifestDynamo } = require("./modules/ManifestDynamo");
const { mapper } = require("./modules/ManifestMapper");
const utf8 = require("utf8");
const log = require("./modules/log");

module.exports = async function updateOrigamiComponentList({
  origamiRepoDataApiKey,
  origamiRepoDataApiSecret
}) {
  const components = await getAllComponentsAndVersions({
    origamiRepoDataApiKey,
    origamiRepoDataApiSecret
  });
  const alreadyAdded = new Set();

  for (const { name, version } of components) {
    const manifest = Object.assign(new ManifestDynamo(), {
      dependencies: JSON.stringify({}),
      devDependencies: JSON.stringify({}),
      name: name,
      version: version
    });
    try {
      const item = await mapper.get(manifest, {
        projection: ["name"]
      });
      if (item) {
        log(`Already done ${name}@${version}, skipping.`);
        continue;
      }
    } catch (e) {
      if (e.name !== "ItemNotFoundException") {
        throw e;
      }
    }
    try {
      manifest.code = await getProductionCodeFor(name, version);
    } catch (error) {
      // do not add components to the database which have no code corresponding to their version.
      if (error.response && error.response.status === 404) {
        log(`There is no code associated with ${name}@${version}`);
        continue;
      }
    }
    log(`Item size: ${utf8.encode(JSON.stringify(manifest)).length}`);
    const key = `${name}-${version}`;
    if (alreadyAdded.has(key)) {
      // This means that Origami -Repo-Data has multiple results for a component at a specific version.
      // This should not happen.
      log(`Duplicatation of ${key}`);
    } else {
      alreadyAdded.add(key);
      try {
        await mapper.put(manifest);
        log(`Added: ${name}@${version}`);
      } catch (err) {
        log(`Failed to add: ${name}@${version} because ${err.toString()}`);
        throw err;
      }
    }
  }
  log("Finished updating components");
};
