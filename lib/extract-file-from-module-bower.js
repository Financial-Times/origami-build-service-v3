"use strict";

const fs = require("fs-extra");
const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules-bower");
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

	try {
		const fileContents = await fs.readFile(
			join(
				installationDirectory,
				"bower_components",
				module.split("@")[0],
				path,
			),
			"utf8",
		);
		// deleteDirectory
		await deleteDirectory(installationDirectory);
		return fileContents;
	} catch (e) {
		const packageName = JSON.parse(await getInstalledPackageName({ module }))
			.name;
		const fileContents = await fs.readFile(
			join(installationDirectory, "bower_components", packageName, path),
			"utf8",
		);
		// deleteDirectory
		await deleteDirectory(installationDirectory);
		return fileContents;
	}
};

const execa = require("execa");
const env = require("npm-run-path").env();

function getInstalledPackageName({ module }) {
	return execa.stdout(
		"bower",
		["info"].concat(module, [
			"--json",
			"--config.interactive=false",
			"--config.registry.search=https://origami-bower-registry.ft.com",
			"--config.registry.search=https://registry.bower.io",
		]),
		{
			env,
		},
	);
}
