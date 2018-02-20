"use strict";
const { resolve } = require("path");
const { rollup } = require("rollup");
const nodent = require("rollup-plugin-nodent");
const commonjs = require("rollup-plugin-commonjs");
const nodeResolve = require("rollup-plugin-node-resolve");
const buble = require("rollup-plugin-buble");
const uglify = require("rollup-plugin-uglify");
const bowerResolve = require("rollup-plugin-bower-resolve");

module.exports = async ({
	installationDirectory,
	entryFile,
	minify = "on",
	namespace = "Origami",
} = {}) => {
	const inputOptions = {
		input: resolve(installationDirectory, entryFile),
		plugins: [
			bowerResolve({
				// The working directory to use with bower (i.e the directory where
				// the `bower.json` is stored).
				cwd: installationDirectory,
			}),
			nodent({
				noRuntime: true,
				promises: true,
			}),
			buble(),
			commonjs(),
			nodeResolve(),
		],
	};

	if (minify === "on") {
		inputOptions.plugins.push(
			uglify({
				compress: {
					keep_infinity: true,
					drop_console: true,
				},
			}),
		);
	}

	const outputOptions = {
		exports: "default",
		freeze: false,
		format: "iife",
		name: namespace,
	};

	const bundle = await rollup(inputOptions);
	const { code } = await bundle.generate(outputOptions);
	return code;
};
