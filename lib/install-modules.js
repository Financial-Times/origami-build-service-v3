"use strict";

const execa = require("execa");

module.exports = function installModueles({
	installationDirectory,
	modules,
	autoinit = "on",
}) {
	const modulesWithoutFileIdentifiers = modules.map(
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
			"--production",
		]),
		{
			cwd: installationDirectory,
		},
	);
};
