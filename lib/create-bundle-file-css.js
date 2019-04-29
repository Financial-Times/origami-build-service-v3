"use strict";

const path = require("path");
const sass = require("sass");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const cssnano = require("cssnano");

const autoprefixerConfig = {
	browsers: [
		"> 1%",
		"last 2 versions",
		"ie > 6",
		"ff ESR",
		"bb >= 7",
		"safari >= 8",
	],
	cascade: false,
	flexbox: "no-2009",
	remove: true,
	grid: true,
};

const autoprefixCSS = autoprefixer(autoprefixerConfig);

const minifyCSS = cssnano({
	preset: "default",
});

module.exports = async ({ installationDirectory, entryFile, minify }) => {
	const postCssTransforms = [];
	postCssTransforms.push(autoprefixCSS);

	if (minify === undefined || minify === "on") {
		postCssTransforms.push(minifyCSS);
	}

	return new Promise((resolve, reject) => {
		sass.render(
			{
				file: entryFile,
				outFile: path.join(installationDirectory, "build", "main.css"),
				includePaths: [path.join(installationDirectory, "bower_components")],
			},
			function(err, result) {
				if (err) {
					reject(err);
				} else {
					resolve(result.css);
				}
			},
		);
	}).then(css =>
		postcss(postCssTransforms).process(css, {
			from: undefined,
		}),
	);
};
