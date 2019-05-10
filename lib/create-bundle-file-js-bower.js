"use strict";

const path = require("path");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const util = require("util");
const promisify = util.promisify;
const BowerResolvePlugin = require("bower-resolve-webpack-plugin");

module.exports = async ({ installationDirectory, entryFile, minify }) => {
	const fs = new MemoryFS();
	const compiler = webpack({
		mode: minify ? "production" : "development",
		entry: entryFile,
		output: {
			path: path.join(installationDirectory, "/build"),
			filename: "bundle.js",
		},
		context: installationDirectory,
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
	compiler.outputFileSystem = fs;

	const compile = promisify(compiler.run.bind(compiler));
	return compile().then(stats => {
		const info = stats.toJson();

		if (stats.hasErrors()) {
			console.error(info.errors);
			throw new Error(info.errors);
		}

		const content = fs.readFileSync(
			path.join(installationDirectory, "/build/bundle.js"),
		);
		return content;
	});
};
