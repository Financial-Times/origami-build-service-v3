import * as AWS from "aws-sdk";
import execa from "execa";
import * as path from "path";
import process from "process";
import { ManifestDynamo } from "./src/modules/manifest-dynamo";
import { mapper } from "./src/modules/manifest-mapper";
import { promises as fs } from "fs";
import * as util from "util";
import rimraf from "rimraf";
const rmrf = util.promisify(rimraf);

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

    const npmPackagePath = path.join(
      packagesFolder,
      packageDirectory,
      filename,
    );
    const code = await fs.readFile(npmPackagePath);
    await rmrf(npmPackagePath);

    const { name, version, dependencies } = JSON.parse(
      await fs.readFile(pkgJsonPath, "utf-8"),
    );

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

bootstrap();
