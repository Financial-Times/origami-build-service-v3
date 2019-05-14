"use strict";

const path = require("path");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const util = require("util");
const promisify = util.promisify;

module.exports = async ({ installationDirectory, entryFile, minify, ua }) => {
	const targets = {};
	if (ua) {
		const [name, version] = ua.split("/");
		targets[name] = version;
	}
	const fs = new MemoryFS();
	const compiler = webpack({
		// Fail out on the first error instead of tolerating it.
		// By default webpack will log these errors in red in the terminal,
		// as well as the browser console when using HMR,
		// but continue bundling.
		bail: true,
		// Cache the generated webpack modules and chunks to improve build speed.
		// Caching is enabled by default while in watch mode.
		// If an object is passed, webpack will use this object for caching.
		// Keeping a reference to this object will allow one to share the same cache between compiler calls:
		cache: false,
		resolveLoader: {
			modules: [
				// Resolve webpack loaders from this projects's node_modules folder.
				path.resolve(__dirname, "../node_modules"),
			],
		},
		mode: minify === "on" ? "production" : "development",
		devtool: minify === "on" ? "hidden-source-map" : "inline-source-map",
		// devtool: "source-map", // source-map most detailed at the expense of build speed.
		// devtool: "inline-source-map", // inlines SourceMap into original file
		// devtool: "eval-source-map", // inlines SourceMap per module
		// devtool: "hidden-source-map", // SourceMap without reference in original file
		// devtool: "cheap-source-map", // cheap-variant of SourceMap without module mappings
		// devtool: "cheap-module-source-map", // cheap-variant of SourceMap with module mappings
		// devtool: "eval", // no SourceMap, but named modules. Fastest at the expense of detail.
		entry: entryFile,
		output: {
			path: path.join(installationDirectory, "/build"),
			filename: "bundle.js",
		},
		context: installationDirectory,
		module: {
			rules: [
				{
					test: /\.m?js$/,
					use: {
						loader: "babel-loader",
						options: {
							presets: [
								[
									"@babel/preset-env",
									{
										targets,
									},
								],
							],
						},
					},
				},
			],
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
