"use strict";

const execa = require("execa");
const env = require("npm-run-path").env();

module.exports = function installModueles({
	installationDirectory,
	modules = [],
}) {
	const allModules = modules;
	const modulesWithoutFileIdentifiers = allModules.map(
		module => module.split(":")[0],
	);

	return execa.stdout(
		"bower",
		["install"].concat(modulesWithoutFileIdentifiers, [
			"--config.interactive=false",
			"--config.registry.search=https://origami-bower-registry.ft.com",
			"--config.registry.search=https://registry.bower.io",
			"--production",
		]),
		{
			cwd: installationDirectory,
			env,
		},
	);
};
