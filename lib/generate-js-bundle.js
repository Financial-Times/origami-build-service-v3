"use strict";

const createTemporaryDirectory = require("./create-temp-folder");
const installModules = require("./install-modules");
const createEntryFile = require("./create-entry-file-js");
const createBundleFile = require("./create-bundle-file-js");
// const deleteDirectory = require("./delete-directory");
const generateShrinkwrap = require("./generate-shrinkwrap");
const fs = require("fs-extra");

module.exports = async ({
	modules,
	namespace,
	minify,
	autoinit,
	shrinkwrap,
}) => {
	// createTemporaryDirectory
	const installationDirectory = await createTemporaryDirectory();
	// installModules
	await installModules({
		installationDirectory,
		modules,
		autoinit,
		shrinkwrap,
	});

	const modulesWithoutVersions = modules.map(module => module.split("@")[0]);
	const shrinkwrapInfo = await generateShrinkwrap({
		installationDirectory,
	});

	const shrinkwrappedDependencies = shrinkwrapInfo.filter(function(
		shrinkModule,
	) {
		// Get module names, ignoring module versions.
		const module = shrinkModule.split("@")[0];
		return !modulesWithoutVersions.includes(module);
	});

	const shrinkwrappedEntryModules = shrinkwrapInfo.filter(function(
		shrinkModule,
	) {
		// Get module names, ignoring module versions.
		const module = shrinkModule.split("@")[0];
		return modulesWithoutVersions.includes(module);
	});

	const shrinkwrapComment = `/** Shrinkwrap URL:
 *      /v3/bundles/js?modules=${shrinkwrappedEntryModules.join(
		",",
	)}&shrinkwrap=${encodeURIComponent(shrinkwrappedDependencies.join(","))}
 */
`;
	// createEntryFile
	const entryFile = await createEntryFile({
		installationDirectory,
		modules,
		autoinit,
	});
	// createBundleFile
	const bundleFile = await createBundleFile({
		installationDirectory,
		entryFile,
		namespace,
		minify,
	});
	const bundleFileContents =
		shrinkwrapComment + (await fs.readFile(bundleFile, "utf8"));
	// deleteDirectory
	// await deleteDirectory(installationDirectory);

	return bundleFileContents;
};
