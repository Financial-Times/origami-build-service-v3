"use strict";

const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules-npm");
const createEntryFile = require("./create-entry-file-js-npm");
const createBundleFile = require("./create-bundle-file-js-npm");
const deleteDirectory = require("./delete-directory");

module.exports = async ({ modules, minify, ua }) => {
	// createTemporaryDirectory
	const installationDirectory = await createTemporaryDirectory();
	// installModules
	await installModules({
		installationDirectory,
		modules,
	});
	const moduleNames = modules.map(mod => {
		if (mod.startsWith("@")) {
			return "@" + mod.split("@")[1];
		} else {
			return mod.split("@")[0];
		}
	});
	// createEntryFile
	const entryFile = await createEntryFile({
		installationDirectory,
		modules: moduleNames,
	});
	// createBundleFile
	const bundleFileContents = await createBundleFile({
		installationDirectory,
		entryFile,
		minify,
		ua,
	});

	// deleteDirectory
	deleteDirectory(installationDirectory).catch(console.error);

	return bundleFileContents;
};
