"use strict";

const path = require("path");
const webpackConfig = require("./webpack-config");
const BowerResolvePlugin = require("bower-resolve-webpack-plugin");

module.exports = ({ installationDirectory, entryFile, minify, targets }) => {
	const config = webpackConfig({
		installationDirectory,
		entryFile,
		minify,
		targets,
	});

	return Object.assign(config, {
		resolve: {
			// This will handle a bower.json's `main` property being an array.
			plugins: [new BowerResolvePlugin()],
			// In which folders the resolver look for modules
			// relative paths are looked up in every parent folder (like node_modules)
			// absolute paths are looked up directly
			// the order is respected
			modules: [path.join(installationDirectory, "bower_components")],
			// These JSON files are read in directories
			descriptionFiles: ["bower.json"],
			// These fields in the description files are looked up when trying to resolve the package directory
			mainFields: ["browser", "main"],
			// These files are tried when trying to resolve a directory
			mainFiles: ["index", "main"],
			// These extensions are tried when resolving a file
			extensions: [".js", ".json"],
		},
	});
};
