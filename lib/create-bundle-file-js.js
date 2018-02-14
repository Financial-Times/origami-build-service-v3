"use strict";

const path = require("path");
const execa = require("execa");
const npmRunPath = require("npm-run-path");

module.exports = async ({ installationDirectory, entryFile, minify }) => {
	const buildFlags = [
		`--js=${entryFile}`,
		`--build-folder=${path.join(installationDirectory, "build")}`,
		"--build-js=main.js",
		`--cwd=${installationDirectory}`,
	];

	if (minify === undefined || minify === "on") {
		buildFlags.push("--production");
	}
	await execa.stdout("origami-build-tools", ["build", ...buildFlags], {
		cwd: installationDirectory,
		env: npmRunPath.env(),
	});

	return `${installationDirectory}/build/main.js`;
};
