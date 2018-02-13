"use strict";

const execa = require("execa");

module.exports = async ({ installationDirectory, entryFile, minify }) => {
	const buildFlags = [
		`--sass=${entryFile}`,
		"--build-folder=build",
		"--build-css=main.css",
	];

	if (minify === undefined || minify === "on") {
		buildFlags.push("--production");
	}
	await execa.stdout("obt", ["build", ...buildFlags], {
		cwd: installationDirectory,
	});

	return `${installationDirectory}/build/main.css`;
};
