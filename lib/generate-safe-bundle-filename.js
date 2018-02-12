"use strict";

const execa = require("execa");
const bluebird = require("bluebird");
const semver = require("semver-extra");
const _ = require("lodash");
const mem = require("mem");
const crypto = require("crypto");

const five_minutes = 1000 * 60 * 5;

function moduleHasDependencies(moduleInfo) {
	return (
		moduleInfo.dependencies && Object.keys(moduleInfo.dependencies).length > 0
	);
}

function getInfoFromDependencies(dependencies) {
	return bluebird.map(
		dependencies,
		([dependency, version]) => {
			// `version` can be non-semver strings such as a github branch/tag or even a github username and repo name.
			// E.G. `dependency` highlight.js and `version` Financial-Times/highlight.js-shim
			if (semver.validRange(version) !== null) {
				return getInfo(`${dependency}@${version}`);
			} else if (version) {
				return getInfo(version);
			} else {
				return getInfo(dependency);
			}
		},
		{
			concurrency: 5,
		},
	);
}
/**
 * Get a nested list of all dependencies of a given module and the latest version that they could be.
 * To avoid making lots of network requests, the results of this function are memoized against the arguments for a maximum of 5 minutes.
 *
 * @param {String} m - The module name, this can include a version range, github repository or git tag. E.G. 'o-header' or 'o-header@^6' or 'o-header@Financial-Times/o-header#beta'
 * @returns {Promise<Array>} A promise which resolves with the nested list of dependency information.
 * @throws {Error} Will throw if the bower command errors.
 *
 */
const getInfo = mem(
	async m => {
		// m can be a mobule with a file identfier. E.G. `o-header@7:/src/demos/main.js
		const [module, file] = m.split(":");

		// execa will run the locally installed bower binary
		const info = JSON.parse(
			await execa.stdout("bower", [
				"info",
				module,
				"--json",
				"--config.interactive=false",
				"--config.registry.search=https://origami-bower-registry.ft.com",
				"--config.registry.search=https://registry.bower.io",
			]),
		);

		// When a specific version is requested, the latest property does not exist.
		// When a version range is requested, use the latest version that is within the range.
		const moduleInfo = info.latest ? info.latest : info;

		if (moduleHasDependencies(moduleInfo)) {
			const dependencies = Array.from(Object.entries(moduleInfo.dependencies));
			const dependencyInfo = await getInfoFromDependencies(dependencies);
			return _.flattenDeep(
				[`${moduleInfo.name}@${moduleInfo.version}`].concat(dependencyInfo),
			);
		} else if (file) {
			return (
				moduleInfo.name + "@" + (moduleInfo.version || module) + ":" + file
			);
		} else {
			return moduleInfo.name + "@" + (moduleInfo.version || module);
		}
		// Memoize the function to speed up lookups. Only keep the memoized results for 5 minutes so that updates to modules can be found.
	},
	{
		maxAge: five_minutes,
	},
);

module.exports = async ({
	modules,
	namespace = "Origami",
	minify = "on",
	autoinit = "on",
}) => {
	const alreadyContainsOAutoInit = modules.some(module =>
		module.startsWith("o-autoinit"),
	);

	if (!alreadyContainsOAutoInit) {
		if (autoinit === "on") {
			modules.push("o-autoinit@*");
		}
	}

	const moduleInfo = await bluebird.map(modules, getInfo, {
		concurrency: 5,
	});
	const flattenedModuleInfo = _.flattenDeep(moduleInfo);
	const flattenedModuleInfoWithOptions = flattenedModuleInfo.concat([
		`minify=${minify}`,
		`namespace=${namespace}`,
		`autoinit=${autoinit}`,
	]);
	// Sorting the results improves ensures we return same file name for the same requested modules, even if the modules were declared in a different order.
	// I.E. Requesting /v2/bundle-hash/js?modules=o-header@^7,o-techdocs@^6 will return the same response as /v2/bundle-hash/js?modules=o-techdocs@^6,o-header@^7
	const uniqueSortedModuleInfo = Array.from(
		new Set(flattenedModuleInfoWithOptions),
	).sort();

	const hash = crypto.createHash("sha512");
	hash.update(uniqueSortedModuleInfo.join("_"));
	return hash.digest("hex");
};
