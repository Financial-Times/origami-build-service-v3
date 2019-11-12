"use strict";

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { Package } = require("./package");
const { HostedSource } = require("./hosted-source");

/**
 * The system-wide cache of downloaded packages.
 *
 * This cache contains all packages that are downloaded from the internet.
 * Packages that are available locally (e.g. path dependencies) don't use this
 * cache.
 */
class SystemCache {
  /**
   * Creates a system cache and registers all sources in `sources`.
   * @param {string} [rootDir]
   */
  constructor(rootDir) {
    /**
     * @type {import('./hosted-source').HostedSource} SystemCache#sources
     * @public
     */
    this.hostedSource = new HostedSource();
    /**
     * @type {string} SystemCache#rootDir
     * @public
     */
    this.rootDir = rootDir == null ? SystemCache.defaultDir : rootDir;
    /**
     * @type {import('./bound-source').BoundSource} SystemCache#_boundHostedSource
     * @public
     */
    this._boundHostedSource = this.hostedSource.bind(this);
  }

  /**
   *
   * @returns {string}
   * @readonly
   * @memberof SystemCache
   */
  tempDir() {
    return path.join(this.rootDir, "_temp");
  }

  /**
   * The built-in hosted source bound to this cache.
   * @returns {import('./bound-source').BoundSource}
   * @readonly
   * @memberof SystemCache
   */
  hosted() {
    return this._boundHostedSource;
  }

  /**
   * Loads the package identified by `id`.
   *
   * @param {import('./package-name').PackageId} id
   * @returns {import('./package').Package}
   * @memberof SystemCache
   */
  load(id) {
    return Package.load(
      this._boundHostedSource.getDirectory(id),
      this.hostedSource,
    );
  }

  /**
   * Create a new temporary directory within the system cache.
   *
   * The system cache maintains its own temporary directory that it uses to
   * stage packages into while downloading. It uses this instead of the OS's
   * system temp directory to ensure that it's on the same volume as the pub
   * system cache so that it can move the directory from it.
   *
   * @returns {Promise<string>}
   * @memberof SystemCache
   */
  async createTempDir() {
    await fs.mkdir(this.tempDir(), { recursive: true });

    return fs.mkdtemp(path.join(this.tempDir(), "dir"));
  }
}

/**
 * @type {string}
 * @memberof SystemCache
 */
SystemCache.defaultDir = path.join(os.homedir(), "/.jake-cache");
module.exports.SystemCache = SystemCache;
