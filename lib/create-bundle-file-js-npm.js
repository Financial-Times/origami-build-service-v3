"use strict";

const path = require("path");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const util = require("util");
const promisify = util.promisify;

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
