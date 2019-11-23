"use strict";

import * as AWS from "aws-sdk";
import * as process from "process";
import { getAllComponentsAndVersions } from "./modules/get-all-components-and-versions";
import { getProductionCodeFor } from "./modules/get-production-code-for";
import { ManifestDynamo } from "./modules/manifest-dynamo";
import { mapper } from "./modules/manifest-mapper";
import * as utf8 from "utf8";
import { debug as log } from "./modules/log";

export async function updateOrigamiComponentList({
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
      const localhost = process.env.LOCALSTACK_HOSTNAME || "localhost";
      const useLocal = process.env.STAGE === "local";
      const s3 = useLocal
        ? new AWS.S3({
            /**
             * Including this option gets localstack to more closely match the defaults for
             * live S3. If you omit this, you will need to add the bucketName to the start
             * of the `Key` property.
             */
            endpoint: `http://${localhost}:4572`,
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
}
