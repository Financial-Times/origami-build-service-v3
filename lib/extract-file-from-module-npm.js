"use strict";

const fs = require("fs-extra");
const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules-npm");
const deleteDirectory = require("./delete-directory");
const join = require("path").join;

module.exports = async ({ module, path }) => {
	// createTemporaryDirectory
	const installationDirectory = await createTemporaryDirectory();
	// installModule
	await installModules({
		installationDirectory,
		modules: [module],
	});

	const fileContents = await fs.readFile(
		join(
			installationDirectory,
			"node_modules",
			module.startsWith("@")
				? "@" + module.split("@")[1]
				: module.split("@")[0],
			path,
		),
		"utf8",
	);
	// deleteDirectory
	await deleteDirectory(installationDirectory);
	return fileContents;
};
