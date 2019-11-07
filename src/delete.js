"use sitrct";

const { ManifestDynamo } = require("./modules/ManifestDynamo");
const { mapper } = require("./modules/ManifestMapper");

async function go() {
  for await (const item of mapper.scan(ManifestDynamo)) {
    // individual items will be yielded as the scan is performed
    console.log("got", item);
    await mapper.delete(Object.assign(new ManifestDynamo(), item));
    console.log("deleted", item);
  }
}

go();
