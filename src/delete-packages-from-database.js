"use sitrct";

import { ManifestDynamo } from "./modules/manifest-dynamo";
import { mapper } from "./modules/manifest-mapper";

async function go() {
  for await (const item of mapper.scan(ManifestDynamo)) {
    // individual items will be yielded as the scan is performed
    console.log("got", item);
    await mapper.delete(Object.assign(new ManifestDynamo(), item));
    console.log("deleted", item);
  }
}

go();
