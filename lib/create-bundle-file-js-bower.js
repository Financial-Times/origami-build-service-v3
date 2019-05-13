"use strict";

const path = require("path");
const webpack = require("webpack");
const MemoryFS = require("memory-fs");
const util = require("util");
const promisify = util.promisify;
const BowerResolvePlugin = require("bower-resolve-webpack-plugin");

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
