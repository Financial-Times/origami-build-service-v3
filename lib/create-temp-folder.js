"use strict";
const os = require("os");
const util = require("util");
const fs = require("fs-extra");
const { sep } = require("path");
const realpath = util.promisify(fs.realpath);
const mkdtemp = util.promisify(fs.mkdtemp);
const ensureDir = util.promisify(fs.ensureDir);

let tmpDir;

/**
 * Creates a unique temporary directory where the directory name is appended with the given folderPrefix.
 * @param {String} folderPrefix - The prefix added to the temporary directory.
 * @returns {Promise<String>} A promise which resolves with the path of the newly created temporary directory.
 */
module.exports = async folderPrefix => {
	if (tmpDir === undefined) {
		// On macOS os.tmpdir is a symlink and not the real path.
		// https://github.com/nodejs/node/issues/11422
		tmpDir = await realpath(os.tmpdir());
	}

	await ensureDir(`${tmpDir}${sep}${folderPrefix}`);
	return `${tmpDir}${sep}${folderPrefix}`;
	// return mkdtemp(`${tmpDir}${sep}${folderPrefix}`);
};
