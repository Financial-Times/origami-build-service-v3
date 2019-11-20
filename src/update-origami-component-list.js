"use strict";

const AWS = require("aws-sdk");
const process = require("process");
const getAllComponentsAndVersions = require("./modules/get-all-components-and-versions");
const getProductionCodeFor = require("./modules/get-production-code-for");
const { ManifestDynamo } = require("./modules/manifest-dynamo");
const { mapper } = require("./modules/manifest-mapper");
const utf8 = require("utf8");
const log = require("./modules/log");

module.exports = async function updateOrigamiComponentList({
  origamiRepoDataApiKey,
  origamiRepoDataApiSecret,
}) {
  const components = await getAllComponentsAndVersions({
    origamiRepoDataApiKey,
    origamiRepoDataApiSecret,
  });
  const alreadyAdded = new Set();

  for (const { name, version, dependencies } of components) {
    const manifest = Object.assign(new ManifestDynamo(), {
      dependencies,
      name: name,
      version: version,
    });
    // try {
    //   const item = await mapper.get(manifest, {
    //     projection: ["name"],
    //   });
    //   if (item) {
    //     log(`Already done ${name}@${version}, skipping.`);
    //     continue;
    //   }
    // } catch (e) {
    //   if (e.name !== "ItemNotFoundException") {
    //     throw e;
    //   }
    // }
    try {
      const code = await getProductionCodeFor(name, version);
      const useLocal = process.env.NODE_ENV !== "production";
      const s3 = useLocal
        ? new AWS.S3({
            /**
             * Including this option gets localstack to more closely match the defaults for
             * live S3. If you omit this, you will need to add the bucketName to the start
             * of the `Key` property.
             */
            endpoint: "http://localhost:4572",
            s3ForcePathStyle: true,
          })
        : new AWS.S3();
      if (!process.env.MODULE_BUCKET_NAME) {
        throw new Error(
          "Environment variable $MODULE_BUCKET_NAME does not exist.",
        );
      }
      const codeLocation = `${name}@'${version}'.tgz`;
      const params = {
        Bucket: process.env.MODULE_BUCKET_NAME,
        Key: codeLocation,
        Body: code,
      };

      await s3.putObject(params).promise();
      manifest.codeLocation = codeLocation;
    } catch (error) {
      // do not add components to the database which have no code corresponding to their version.
      if (error.response && error.response.status === 404) {
        log(`There is no code associated with ${name}@${version}`);
        continue;
      }
      throw error;
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
