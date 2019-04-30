"use strict";
const os = require("os");
const util = require("util");
const fs = require("fs-extra");
const ensureDir = util.promisify(fs.ensureDir);
const uniqueFilename = require("unique-filename");

/**
 * Creates a unique temporary directory.
 * @returns {Promise<String>} A promise which resolves with the path of the newly created temporary directory.
 */
module.exports = async () => {
	const path = uniqueFilename(os.tmpdir());
	await ensureDir(path);
	return path;
};
