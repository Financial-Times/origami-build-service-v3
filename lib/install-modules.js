"use strict";

const execa = require("execa");
const npmRunPath = require("npm-run-path");

module.exports = function installModueles({
	installationDirectory,
	modules = [],
	autoinit = "on",
	shrinkwrap = [],
}) {
	const allModules = modules.concat(shrinkwrap);
	const modulesWithoutFileIdentifiers = allModules.map(
		module => module.split(":")[0],
	);
	const alreadyContainsOAutoInit = modulesWithoutFileIdentifiers.some(module =>
		module.startsWith("o-autoinit"),
	);

	if (!alreadyContainsOAutoInit) {
		if (autoinit === "on") {
			modulesWithoutFileIdentifiers.push("o-autoinit@*");
		}
	}

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
			env: npmRunPath.env(),
		},
	);
};
