"use strict";

const execa = require("execa");
const path = require("path");
const outputFile = require("fs-extra").outputFile;
const npmRunPath = require("npm-run-path");

module.exports = async ({ installationDirectory, modules }) => {
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
		// m can be a mobule with a file identfier. E.G. `o-header@7:/src/demos/main.css`
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
				file = mainFiles.find(
					file => file.endsWith(".scss") || file.endsWith(".css"),
				);
			} else if (typeof mainFiles === "string") {
				file =
					mainFiles.endsWith(".scss") || mainFiles.endsWith(".css")
						? mainFiles
						: undefined;
			}
		}

		if (file) {
			files.set(moduleName, file);
		}
	}

	let entryFileData = " ";
	for (const file of files.values()) {
		entryFileData = entryFileData + `@import "${file}";`;
	}
	const entryFileLocation = path.join(installationDirectory, "src/main.scss");

	await outputFile(entryFileLocation, entryFileData);

	return entryFileLocation;
};
