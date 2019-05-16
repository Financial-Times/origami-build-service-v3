"use strict";

const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules-bower");
const createEntryFile = require("./create-entry-file-css-bower");
const createBundleFile = require("./create-bundle-file-css");
const deleteDirectory = require("./delete-directory");

module.exports = async ({ modules, minify, brand }) => {
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
		brand,
	});
	// createBundleFile
	const bundleFile = await createBundleFile({
		installationDirectory,
		entryFile,
		minify,
	});
	const bundleFileContents = bundleFile;

	// deleteDirectory
	deleteDirectory(installationDirectory).catch(console.error);

	return bundleFileContents;
};
