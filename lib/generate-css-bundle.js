"use strict";

const fs = require("fs-extra");
const createTemporaryDirectory = require("./create-temp-folder");
const createBundleFilename = require("./generate-safe-bundle-filename");
const installModules = require("./install-modules");
const createEntryFile = require("./create-entry-file-css");
const createBundleFile = require("./create-bundle-file-css");
// const deleteDirectory = require("./delete-directory");

module.exports = async ({ modules, minify }) => {
	// createFilename
	const filename = await createBundleFilename({
		modules,
		minify,
	});
	// createTemporaryDirectory
	const installationDirectory = await createTemporaryDirectory(filename);
	// installModules
	await installModules({
		installationDirectory,
		modules,
	});
	// createEntryFile
	const entryFile = await createEntryFile({
		installationDirectory,
		modules,
	});
	// createBundleFile
	const bundleFile = await createBundleFile({
		installationDirectory,
		entryFile,
		minify,
	});
	const bundleFileContents = await fs.readFile(bundleFile, "utf8");
	// deleteDirectory
	// await deleteDirectory(installationDirectory);

	return bundleFileContents;
};
