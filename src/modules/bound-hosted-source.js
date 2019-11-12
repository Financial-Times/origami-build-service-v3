"use strict";

const AWS = require("aws-sdk");
const decompress = require("decompress");
const { writeFile, rename, mkdir } = require("fs").promises;
const { fromJS, Map } = require("immutable");
const path = require("path");
const { CachedSource } = require("./cached-source");
const { dirExists, listDir, PackageNotFoundError } = require("./home");
const { Package } = require("./package");
const { Manifest } = require("./manifest");
const { ManifestDynamo } = require("./manifest-dynamo");
const { mapper } = require("./manifest-mapper");
const log = require("./log");

/**
 * The `BoundSource` for `HostedSource`.
 *
 * @class BoundHostedSource
 * @extends {CachedSource}
 * @implements {BoundSource}
 */
class BoundHostedSource extends CachedSource {
  /**
   * Creates an instance of BoundHostedSource.
   * @param {import('./hosted-source').HostedSource} source
   * @param {import('./system-cache').SystemCache} systemCache
   * @memberof BoundHostedSource
   */
  constructor(source, systemCache) {
    super();
    Object.defineProperty(this, "source", {
      value: source,
      writable: true,
    });
    /**
     * @property {import('./hosted-source').HostedSource} source
     * @instance
     * @memberof BoundHostedSource
     */
    this.source = source;
    Object.defineProperty(this, "systemCache", {
      value: systemCache,
      writable: true,
    });
  }

  /**
   * Downloads a list of all versions of a package that are available from the site.
   *
   * @param {import('./package-name').PackageRef} ref
   * @returns {Promise<Array<import('./package-name').PackageId>>}
   * @memberof BoundHostedSource
   */
  async doGetVersions(ref) {
    /**
     * @private
     * @type {import('immutable').Map<import('./package-name').PackageRef, Promise<Array<import('./package-name').PackageId>>>}
     */
    this.doGetVersionsMemo = this.doGetVersionsMemo
      ? this.doGetVersionsMemo
      : Map();
    if (this.doGetVersionsMemo.has(ref)) {
      // @ts-ignore Type 'PackageId[] | undefined' is not assignable to type 'PackageId[]'.
      return this.doGetVersionsMemo.get(ref);
    } else {
      this.doGetVersionsMemo = this.doGetVersionsMemo.set(
        ref,
        (async () => {
          const $package = this.source._parseDescription(ref.description);
          log(`Get versions from ${$package}.`);
          const results = [];
          try {
            let count = 0;
            for await (const m of mapper.query(
              ManifestDynamo,
              {
                name: $package,
              },
              {
                projection: ["name", "version", "dependencies"],
              },
            )) {
              count++;
              let manifestMap = Map();
              manifestMap = manifestMap.set("name", m.name);
              manifestMap = manifestMap.set("version", m.version);
              manifestMap = manifestMap.set(
                "dependencies",
                fromJS(JSON.parse(m.dependencies || "{}")),
              );
              const manifest = Manifest.fromMap(
                manifestMap,
                this.systemCache.sources,
                ref.name,
              );
              const id = this.source.idFor(ref.name, manifest.version);
              this.memoizeManifest(id, manifest);
              results.push(id);
            }

            // If no versions are found, make a request for a specific version
            // so that we can get a better error message from DynamoDB
            if (count == 0) {
              await mapper.get(
                Object.assign(new ManifestDynamo(), {
                  name: $package,
                  version: "0",
                }),
                {
                  projection: ["name", "version", "dependencies"],
                },
              );
            }
          } catch (error) {
            const $package = this.source._parseDescription(ref.description);
            this._throwFriendlyError(error, $package);
          }

          return results;
        })(),
      );

      // @ts-ignore Type 'PackageId[] | undefined' is not assignable to type 'PackageId[]'.
      return this.doGetVersionsMemo.get(ref);
    }
  }

  /**
   * Downloads and parses the manifest for a specific version of a package that is available from the site.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<import('./manifest').Manifest>}
   * @memberof BoundHostedSource
   */
  async describeUncached(id) {
    const $package = this.source._parseDescription(id.description);
    const version = encodeURIComponent(id.version.toString());
    const manifest = Map();
    try {
      const m = await mapper.get(
        Object.assign(new ManifestDynamo(), { name: $package, version }),
        { projection: ["name", "version", "dependencies"] },
      );
      manifest.set("name", m.name);
      manifest.set("version", m.version);
      manifest.set("dependencies", fromJS(JSON.parse(m.dependencies || "{}")));
    } catch (error) {
      this._throwFriendlyError(error);
    }

    return Manifest.fromMap(manifest, this.systemCache.sources, id.name);
  }

  /**
   * Downloads the package identified by `id` to the system cache.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {Promise<Package>}
   * @memberof BoundHostedSource
   */
  async downloadToSystemCache(id) {
    if (!(await this.isInSystemCache(id))) {
      const packageDir = this.getDirectory(id);
      await mkdir(path.dirname(packageDir), { recursive: true });
      const $package = this.source._parseDescription(id.description);
      await this._download($package, id.version, packageDir);
    }

    return Package.load(this.getDirectory(id), this.systemCache.sources);
  }

  /**
   * The system cache directory for the hosted source contains subdirectories
   * for each separate repository URL that's used on the system.
   *
   * Each of these subdirectories then contains a subdirectory for each
   * package downloaded from that site.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {string}
   * @memberof BoundHostedSource
   */
  getDirectory(id) {
    const $package = this.source._parseDescription(id.description);

    return path.join(this.systemCacheRoot, `${$package}-${id.version}`);
  }

  /**
   * Gets all of the packages that have been downloaded into the system cache from the default server.
   *
   * @returns {Promise<Array<Package>>}
   * @memberof BoundHostedSource
   */
  async getCachedPackages() {
    const cacheDir = path.join(this.systemCacheRoot);
    if (!(await dirExists(cacheDir))) {
      return [];
    }
    const entries = await listDir(cacheDir);

    return entries.map(entry => {
      return Package.load(entry, this.systemCache.sources);
    });
  }

  /**
   * Downloads package `package` at `version` from `server`, and unpacks it into `destPath`.
   *
   * @param {string} $package
   * @param {import('./version').Version} version
   * @param {string} destPath
   * @returns {Promise<void>}
   * @memberof BoundHostedSource
   */
  async _download($package, version, destPath) {
    log(`Downloading ${$package} ${version}...`);
    // Download and extract the archive to a temp directory.
    const tempDir = await this.systemCache.createTempDir();
    const response = await mapper.get(
      Object.assign(new ManifestDynamo(), { name: $package, version }),
    );
    const a = await this.systemCache.createTempDir();
    const tarPath = path.join(a, `${$package}@${version}.tar.gz`);
    await mkdir(path.dirname(tarPath), { recursive: true });
    const s3 = new AWS.S3();
    if (!process.env.MODULE_BUCKET_NAME) {
      throw new Error(
        "Environment variable $MODULE_BUCKET_NAME does not exist.",
      );
    }
    const params = {
      Bucket: process.env.MODULE_BUCKET_NAME,
      Key: response.codeLocation,
    };

    const { Body: code } = await s3.getObject(params).promise();
    await writeFile(tarPath, code);
    await decompress(tarPath, tempDir, {
      strip: 1,
    });
    // Now that the get has succeeded, move it to the real location in the
    // cache. This ensures that we don't leave half-busted ghost
    // directories in the user's pub cache if a get fails.
    await rename(tempDir, destPath);
  }

  /**
   * When an error occurs trying to read something about `package` from `url`,
   * this tries to translate into a more user friendly error message.
   *
   * Always throws an error, either the original one or a better one.
   *
   * @param {Error} error
   * @param {string} [$package]
   * @memberof BoundHostedSource
   */
  _throwFriendlyError(error, $package) {
    if (error.name === "ItemNotFoundException") {
      throw new PackageNotFoundError(`could not find package ${$package}`);
    } else {
      // Otherwise re-throw the original error.
      throw error;
    }
  }

  /**
   * Given a URL, returns a "normalized" string to be used as a directory name for packages downloaded from the server at that URL.
   *
   * @param {string} url
   * @returns {string}
   * @memberof BoundHostedSource
   */
  _urlToDirectory(url) {
    function replacer(substring) {
      return `%${Array.from(substring, character =>
        character.codePointAt(0),
      ).join("")}`;
    }

    return url.replace(/[<>:"\\/|?*%]/g, replacer);
  }
}

module.exports.BoundHostedSource = BoundHostedSource;
