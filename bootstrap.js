"use strict";

const dotenv = require("dotenv");
dotenv.config();
const AWS = require("aws-sdk");
const execa = require("execa");
const path = require("path");
const process = require("process");
const { ManifestDynamo } = require("./src/modules/manifest-dynamo");
const { mapper } = require("./src/modules/manifest-mapper");
// const log = require("./src/modules/log");
const fs = require("fs").promises;

process.on("unhandledRejection", function(err) {
  console.error(err);
  process.exit(1);
});

const useLocal = process.env.NODE_ENV !== "production";
const s3 = useLocal
  ? new AWS.S3({
      endpoint: "http://localhost:4572",
      /**
       * Including this option gets localstack to more closely match the defaults for
       * live S3. If you omit this, you will need to add the bucketName to the start
       * of the `Key` property.
       */
      s3ForcePathStyle: true,
    })
  : new AWS.S3();

async function bootstrap() {
  const packagesFolder = path.join(__dirname, "./bootstrap-packages");

  console.log(`Reading directory ${packagesFolder}`);

  const packageDirectories = await fs.readdir(packagesFolder);

  for (const packageDirectory of packageDirectories) {
    const pkgJsonPath = path.join(
      packagesFolder,
      packageDirectory,
      "package.json",
    );
    console.log(`Reading ${pkgJsonPath}`);

    const { stdout: filename } = await execa.command(`npm pack .`, {
      cwd: path.join(packagesFolder, packageDirectory),
      shell: true,
    });

    const code = await fs.readFile(
      path.join(packagesFolder, packageDirectory, filename),
    );

    const { name, version, dependencies } = JSON.parse(
      await fs.readFile(pkgJsonPath, "utf-8"),
    );

    const codeLocation = `${name}@'${version}'.tgz`;
    const params = {
      Bucket: process.env.MODULE_BUCKET_NAME,
      Key: codeLocation,
      Body: code,
    };

    await s3.putObject(params).promise();

    const manifest = Object.assign(new ManifestDynamo(), {
      dependencies,
      name,
      version,
      codeLocation,
    });

    console.log(`Manifest ${JSON.stringify(manifest)}`);

    await mapper.put(manifest);

    console.log("done");
  }
}
console.log(process.env.COMPONENT_TABLE);
bootstrap();
