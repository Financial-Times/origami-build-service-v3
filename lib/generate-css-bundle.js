"use strict";

const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules");
const createEntryFile = require("./create-entry-file-css");
const createBundleFile = require("./create-bundle-file-css");
// const deleteDirectory = require("./delete-directory");

module.exports = async ({ modules, minify }) => {
	// createTemporaryDirectory
	const installationDirectory = await createTemporaryDirectory();
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
	const bundleFileContents = bundleFile;
	// deleteDirectory
	// await deleteDirectory(installationDirectory);

	return bundleFileContents;
};
