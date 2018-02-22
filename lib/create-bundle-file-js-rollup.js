"use strict";
const { resolve, join, dirname } = require("path");
const { rollup } = require("rollup");
const nodent = require("rollup-plugin-nodent");
const commonjs = require("rollup-plugin-commonjs");
const nodeResolve = require("rollup-plugin-node-resolve");
const buble = require("rollup-plugin-buble");
const uglify = require("rollup-plugin-uglify");
const replace = require("rollup-plugin-replace");
const json = require("rollup-plugin-json");
const glob = Promise.promisify(require("glob"));
const { readFile } = require("fs-extra");

function bower({ cwd }) {
	const paths = {};

	return glob(join(cwd, "bower_components", "*/.bower.json")).then(function(
		files,
	) {
		const promises = files.map(function(bowerFile) {
			return readFile(bowerFile).then(function(result) {
				const dir = dirname(bowerFile).replace(cwd + "/", "");
				const json = result.toString();
				const config = JSON.parse(json);
				let main = config.main || "";
				if (main) {
					if (Array.isArray(main)) {
						main = main.find(file => file.endsWith(".js")) || "";
					}
					const modulePath = join(dir, main);

					paths[config.name] = modulePath;
				}
			});
		});

		return Promise.all(promises).then(function() {
			return paths;
		});
	});
}

module.exports = async ({
	installationDirectory,
	entryFile,
	minify = "on",
	namespace = "Origami",
} = {}) => {
	const bowerPaths = await bower({ cwd: installationDirectory });
	const inputOptions = {
		input: resolve(installationDirectory, entryFile),
		plugins: [
			nodeResolve(),
			{
				resolveId: function(id) {
					return bowerPaths[id];
				},
			},
			commonjs({
				sourceMaps: false,
			}),
			nodent({
				noRuntime: true,
				promises: true,
			}),
			buble({
				transforms: { dangerousForOf: true },
			}),
			replace({
				"process.env.NODE_ENV": JSON.stringify("production"),
			}),
			json(),
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
		freeze: false,
		format: "iife",
		name: namespace,
	};

	const bundle = await rollup(inputOptions);
	const { code } = await bundle.generate(outputOptions);
	return code;
};
