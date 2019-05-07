"use strict";

const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules-bower");
const createEntryFile = require("./create-entry-file-js");
const createBundleFile = require("./create-bundle-file-js");
// const deleteDirectory = require("./delete-directory");
const fs = require("fs-extra");

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
	const bundleFileContents = await fs.readFile(bundleFile, "utf8");
	// deleteDirectory
	// await deleteDirectory(installationDirectory);

	return bundleFileContents;
};
