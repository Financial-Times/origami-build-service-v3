"use strict";

const execa = require("execa");
const path = require("path");
const outputFile = require("fs-extra").outputFile;
const env = require("npm-run-path").env();

module.exports = async ({ installationDirectory, modules, brand }) => {
	const mainFilesOfInstalledModules = JSON.parse(
		await execa.stdout(
			"bower",
			["ls", "--json", "--paths", "--relative=true"],
			{
				cwd: installationDirectory,
				env,
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
			if (file) {
				file = file.replace(/^bower_components\//, "");
			}
		}

		if (file) {
			files.set(moduleName, file);
		}
	}

	let entryFileData = `$o-brand: ${brand};`;
	for (const [module, file] of files.entries()) {
		entryFileData =
			entryFileData + `$${module}-is-silent: false; @import "${file}";`;
	}
	const entryFileLocation = path.join(installationDirectory, "src/main.scss");

	await outputFile(entryFileLocation, entryFileData);

	return entryFileLocation;
};
