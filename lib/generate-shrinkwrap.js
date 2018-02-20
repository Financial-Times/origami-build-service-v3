"use strict";

const execa = require("execa");
const npmRunPath = require("npm-run-path");

module.exports = async function installedModulesInfo({
	installationDirectory,
}) {
	const moduleTree = JSON.parse(
		await execa.stdout(
			"bower",
			["list"].concat(module, [
				"--json",
				"--config.interactive=false",
				"--offline",
			]),
			{
				cwd: installationDirectory,
				env: npmRunPath.env(),
			},
		),
	);

	return Array.from(
		new Set(flatten(retrieveDeps({ moduleTree, entry: true }))),
	).sort();
};

function retrieveDeps({ moduleTree, entry }) {
	// console.log({ pkgMeta: moduleTree.pkgMeta });
	if (Object.values(moduleTree.dependencies).length === 0) {
		return `${moduleTree.pkgMeta._originalSource}@${
			moduleTree.pkgMeta.version
		}`;
	}
	if (!entry && moduleTree.pkgMeta) {
		return [
			`${moduleTree.pkgMeta._originalSource}@${moduleTree.pkgMeta.version}`,
		].concat(
			Object.values(moduleTree.dependencies).map(subModuleTree =>
				retrieveDeps({
					moduleTree: subModuleTree,
				}),
			),
		);
	}
	return Object.values(moduleTree.dependencies).map(subModuleTree =>
		retrieveDeps({ moduleTree: subModuleTree }),
	);
}

function flatten(list) {
	return list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}
