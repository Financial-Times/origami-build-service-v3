/**
 * A source from which to get packages.
 *
 * Each source has many packages that it looks up using `PackageId`s. When a
 * package needs a dependency from a source, it is first installed in
 * the `SystemCache` and then acquired from there.
 *
 * Each user-visible source has two classes: a `Source` that knows how to do
 * filesystem-independent operations like parsing and comparing descriptions,
 * and a `BoundSource` that knows how to actually install (and potentially
 * download) those packages. Only the `BoundSource` has access to the
 * `SystemCache`.
 *
 * ## Subclassing
 *
 * All `Source`s should extend this class and all `BoundSource`s should extend
 * `BoundSource`. In addition to defining the behavior of various methods,
 * sources define the structure of package descriptions used in `PackageRef`s,
 * `PackageRange`s, and `PackageId`s. There are three distinct types of
 * description, although in practice most sources use the same format for one
 * or more of these:
 *
 * * User descriptions. These are included in manifests and usually written by
 *   hand. They're typically more flexible in the formats they allow to
 *   optimize for ease of authoring.
 *
 * * Reference descriptions. These are the descriptions in `PackageRef`s and
 *   `PackageRange`. They're parsed directly from user descriptions using
 *   `parseRef`, and so add no additional information.
 *
 * * ID descriptions. These are the descriptions in `PackageId`s, which
 *   uniquely identify and provide the means to locate the concrete code of a
 *   package. They may contain additional expensive-to-compute information
 *   relative to the corresponding reference descriptions. These are the
 *   descriptions stored in lock files.
 *
 * @class Source
 * @abstract
 */
export class Source {
  /**
   * Creates an instance of Source.
   * @param {string} name
   * @param {boolean} [hasMultipleVersions=false]
   * @memberof Source
   */
  constructor(name, hasMultipleVersions = false) {
    this.name = name;
    this.hasMultipleVersions = hasMultipleVersions;
  }

  /**
   * When a package `description` is shown to the user, this is called to
   * convert it into a human-friendly form.
   *
   * By default, it just converts the description to a string, but sources
   * may customize this.
   * @returns {string}
   * @memberof Source
   */
  formatDescription(description) {
    return description.toString();
  }

  /**
   * Returns the source's name.
   * @returns {string}
   * @memberof Source
   */
  toString() {
    return this.name;
  }

  /**
   * @abstract
   * @param {import('./system-cache').SystemCache} systemCache
   * @returns {import('./bound-source').BoundSource}
   * @memberof Source
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  bind(systemCache) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {string} name
   * @param {*} description
   * @param {string} [containingPath]
   * @returns {import('./package-name').PackageRef}
   * @memberof Source
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  parseRef(name, description, containingPath) {
    throw new Error("unimplemented");
  }
  /**
   * @abstract
   * @param {string} name
   * @param {import('./version').Version} version
   * @param {*} description
   * @param {string} [containingPath]
   * @returns {import('./package-name').PackageId}
   * @memberof Source
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  parseId(name, version, description, containingPath) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {(string | import('immutable').Map<string, string>)} description1
   * @param {(string | import('immutable').Map<string, string>)} description2
   * @returns {boolean}
   * @memberof Source
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  descriptionsEqual(description1, description2) {
    throw new Error("unimplemented");
  }

  /**
   * @abstract
   * @param {(string | import('immutable').Map<string, string>)} description
   * @returns {number}
   * @memberof Source
   */
  // @ts-ignore
  // eslint-disable-next-line no-unused-vars
  hashDescription(description) {
    throw new Error("unimplemented");
  }
}
