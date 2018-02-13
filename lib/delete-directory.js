"use strict";

const util = require("util");
const rimraf = util.promisify(require("rimraf"));

/**
 * Recursivelt delete a directory and any files contained within.
 * @param {String} directory - The directory to delete, including all contents inside the directory.
 * @returns {Promise<undefined>} A promise which resolves when the deletion has completed.
 */
module.exports = directory =>
	rimraf(directory, {
		glob: false,
	});
