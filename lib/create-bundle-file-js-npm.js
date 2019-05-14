"use strict";

const path = require("path");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const util = require("util");
const promisify = util.promisify;
const webpackConfig = require("./webpack-config");

module.exports = async ({ installationDirectory, entryFile, minify, ua }) => {
	const targets = {};
	if (ua) {
		const [name, version] = ua.split("/");
		targets[name] = version;
	}
	const fs = new MemoryFS();
	const compiler = webpack(
		webpackConfig({ installationDirectory, entryFile, minify, targets }),
	);
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
