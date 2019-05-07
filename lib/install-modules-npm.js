"use strict";

const execa = require("execa");
const env = require("npm-run-path").env();

module.exports = function installModulesBower({
	installationDirectory,
	modules = [],
}) {
	return execa.stdout("npm", ["install"].concat(modules, ["--production"]), {
		cwd: installationDirectory,
		env,
	});
};
