"use strict";

const path = require("path");
const outputFile = require("fs-extra").outputFile;

module.exports = async ({ installationDirectory, modules }) => {
	const entryFileLocation = path.join(installationDirectory, "src/main.js");

	await outputFile(
		entryFileLocation,
		"if (typeof Origami === 'undefined') {Origami = {};}" +
			modules
				.map(
					name =>
						`import * as ${name} from "${name}";\nOrigami[${name}] = ${name};`,
				)
				.join("\n"),
	);

	return entryFileLocation;
};
