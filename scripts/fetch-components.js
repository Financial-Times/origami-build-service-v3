"use strict";

// https://github.com/nodejs/node/issues/20392
// installs an 'unhandledRejection' handler which exits the process.
require("make-promises-safe");

const dotenv = require("dotenv");
dotenv.config();

const RepoDataClient = require("@financial-times/origami-repo-data-client");
const fs = require("fs").promises;
const path = require("path");
const repoData = new RepoDataClient({
	apiKey: process.env.ORIGAMI_REPO_DATA_ACCESS_KEY_ID,
	apiSecret: process.env.ORIGAMI_REPO_DATA_ACCESS_KEY_SECRET,
});

const componentFileLocation = path.join(__dirname, "./components.json");
repoData
	.listRepos({
		type: "module",
		status: ["active", "maintained"],
	})
	.then(components => {
		const componentsWithScssOrJs = components
			.filter(repo => {
				if (repo.name.startsWith("o-comment")) {
					return false;
				}
				return repo.languages.includes("js") || repo.languages.includes("scss");
			})
			.map(component => {
				return {
					name: component.name,
					version: component.version,
					brands: component.brands,
					languages: component.languages,
				};
			});
		return fs.writeFile(
			componentFileLocation,
			JSON.stringify(componentsWithScssOrJs, undefined, 4),
			"utf-8",
		);
	})
	.then(() => {
		console.log(`Updated components file located at ${componentFileLocation}`);
	});
