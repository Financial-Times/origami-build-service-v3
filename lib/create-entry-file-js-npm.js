"use strict";

const path = require("path");
const outputFile = require("fs-extra").outputFile;
const lodash = require("lodash");

module.exports = async ({ installationDirectory, modules }) => {
	const entryFileLocation = path.join(installationDirectory, "src/main.js");

	const entryFileContents = modules
		.map((name, index) => {
			const camelCasedName = lodash.camelCase(name);
			const importModule = `import * as ${camelCasedName} from "${name}";`;
			let addModuleToOrigamiGlobal = "";
			if (index === 0) {
				addModuleToOrigamiGlobal += `if (typeof Origami === 'undefined') {window.Origami = {};}\n`;
			}
			addModuleToOrigamiGlobal += `window.Origami["${name}"] = ${camelCasedName};`;
			return `${importModule}\n${addModuleToOrigamiGlobal}`;
		})
		.join("\n");

	await outputFile(entryFileLocation, entryFileContents);

	return entryFileLocation;
};
