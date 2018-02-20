"use strict";

const execa = require("execa");
const path = require("path");
const outputFile = require("fs-extra").outputFile;
const npmRunPath = require("npm-run-path");

module.exports = async ({
	installationDirectory,
	modules,
	namespace = "Origami",
}) => {
	const mainFilesOfInstalledModules = JSON.parse(
		await execa.stdout(
			"bower",
			["ls", "--json", "--paths", "--relative=false"],
			{
				cwd: installationDirectory,
				env: npmRunPath.env(),
			},
		),
	);

	const files = new Map();
	for (const m of modules) {
		// m can be a module with a file identfier. E.G. `o-header@7:/src/demos/main.js
		const [module, specificFile] = m.split(":");
		// module can be a module with a version specified. E.G. `o-header@^7`.
		const moduleName = module.split("@")[0];
		let file;
		if (specificFile) {
			file = path.join(
				installationDirectory,
				"bower_components",
				moduleName,
				specificFile,
			);
		} else {
			const mainFiles = mainFilesOfInstalledModules[moduleName];
			if (Array.isArray(mainFiles)) {
				file = mainFiles.find(file => file.endsWith(".js"));
			} else if (typeof mainFiles === "string") {
				file = mainFiles.endsWith(".js") ? mainFiles : undefined;
			}
		}

		if (file) {
			files.set(moduleName, file);
		}
	}

	let entryFileData = `'use strict';window["${namespace}"]={};`;
	for (const [name, file] of files) {
		entryFileData =
			entryFileData + `window["${namespace}"]["${name}"] = require('${file}');`;
	}
	const entryFileLocation = path.join(installationDirectory, "src/main.js");

	await outputFile(entryFileLocation, entryFileData);

	return entryFileLocation;
};
