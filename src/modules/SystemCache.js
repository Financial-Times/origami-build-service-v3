"use strict";

const fs = require("fs").promises;
const { Map } = require("immutable");
const path = require("path");
const { ArgumentError, HOME } = require("./HOME");
const { Package } = require("./Package");
const { SourceRegistry } = require("./SourceRegistry");
const { UnknownSource } = require("./UnknownSource");

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
     * @type {import('./SourceRegistry').SourceRegistry} SystemCache#sources
     * @public
     */
    this.sources = new SourceRegistry();
    /**
     * @type {string} SystemCache#rootDir
     * @public
     */
    this.rootDir = rootDir == null ? SystemCache.defaultDir : rootDir;
    /**
     * @type {import('immutable').Map<import('./Source').Source, import('./BoundSource').BoundSource>} SystemCache#_boundSources
     * @public
     */
    this._boundSources = Map();
    for (const source of this.sources.all) {
      this._boundSources = this._boundSources.set(source, source.bind(this));
    }
  }

  /**
   *
   * @returns {string}
   * @readonly
   * @memberof SystemCache
   */
  get tempDir() {
    return path.join(this.rootDir, "_temp");
  }

  /**
   * The built-in hosted source bound to this cache.
   * @returns {import('./BoundSource').BoundSource}
   * @readonly
   * @memberof SystemCache
   */
  get hosted() {
    return this.source(this.sources.hosted);
  }

  /**
   * The default source bound to this cache.
   * @returns {import('./BoundSource').BoundSource}
   * @readonly
   * @memberof SystemCache
   */
  get defaultSource() {
    return this.source(this.sources.defaultSource);
  }

  /**
   * Returns the version of `source` bound to this cache.
   *
   * @param {import('./Source').Source} source
   * @returns {import('./BoundSource').BoundSource}
   * @memberof SystemCache
   */
  source(source) {
    if (!this._boundSources.has(source)) {
      this._boundSources = this._boundSources.set(source, source.bind(this));
    }

    return this._boundSources.get(source, source.bind(this));
  }

  /**
   * Loads the package identified by `id`.
   * Throws an `ArgumentError` if `id` has an invalid source.
   *
   * @param {import('./PackageName').PackageId} id
   * @returns {import('./Package').Package}
   * @memberof SystemCache
   */
  load(id) {
    if (id.source instanceof UnknownSource) {
      throw new ArgumentError(`Unknown source ${id.source}.`);
    }
    if (id.source) {
      return Package.load(
        this.source(id.source).getDirectory(id),
        this.sources,
      );
    } else {
      throw new Error(`id.source is undefined.`);
    }
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
    await fs.mkdir(this.tempDir, { recursive: true });

    return fs.mkdtemp(path.join(this.tempDir, "dir"));
  }
}

/**
 * @type {string}
 * @memberof SystemCache
 */
SystemCache.defaultDir = path.join(HOME, "/.jake-cache");
module.exports.SystemCache = SystemCache;
