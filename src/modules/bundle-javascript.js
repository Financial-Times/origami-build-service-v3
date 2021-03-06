"use strict";

import execa from "execa";
import * as oax from "oax";

/**
 * Creates a bundle using `oax` using the index.js file located within `location` as the entrypoint of the bundle.
 *
 * @param {String} location The path where the index.js resides within.
 * @returns {Promise<String>} The bundled JavaScript as a string
 */
export async function createJavaScriptBundle(location) {
  const { stdout: bundle } = await execa(oax, [location]);

  return bundle;
}
