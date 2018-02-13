"use strict";

const execa = require("execa");

module.exports = async ({ installationDirectory, entryFile, minify }) => {
	const buildFlags = [
		`--js=${entryFile}`,
		"--build-folder=build",
		"--build-js=main.js",
	];

	if (minify === undefined || minify === "on") {
		buildFlags.push("--production");
	}
	await execa.stdout("obt", ["build", ...buildFlags], {
		cwd: installationDirectory,
	});

	return `${installationDirectory}/build/main.js`;
};
