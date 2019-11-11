"use sitrct";

const { ManifestDynamo } = require("./modules/manifest-dynamo");
const { mapper } = require("./modules/manifest-mapper");

async function go() {
  for await (const item of mapper.scan(ManifestDynamo)) {
    // individual items will be yielded as the scan is performed
    console.log("got", item);
    await mapper.delete(Object.assign(new ManifestDynamo(), item));
    console.log("deleted", item);
  }
}

go();
