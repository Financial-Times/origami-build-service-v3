"use strict";

const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = ({ installationDirectory, entryFile, minify, targets }) => {
	const productionMode = minify === "on" ? true : false;
	return {
		optimization: {
			// Tell webpack to minimize the bundle
			minimize: productionMode ? true : false,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					sourceMap: false, // Must be set to true if using source-maps in production
				}),
			],
		},
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
		mode: productionMode ? "production" : "development",
		devtool: productionMode ? "hidden-source-map" : "inline-source-map",
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
			pathinfo: false,
		},
		performance: false,
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
	};
};
