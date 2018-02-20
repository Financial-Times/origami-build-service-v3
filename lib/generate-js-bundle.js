"use strict";

const fs = require("fs-extra");
const createTemporaryDirectory = require("./create-temp-folder");
const createBundleFilename = require("./generate-safe-bundle-filename");
const installModules = require("./install-modules");
const createEntryFile = require("./create-entry-file-js");
const createBundleFile = require("./create-bundle-file-js");
// const deleteDirectory = require("./delete-directory");
const generateShrinkwrap = require("./generate-shrinkwrap");

module.exports = async ({
	modules,
	namespace,
	minify,
	autoinit,
	shrinkwrap,
}) => {
	// createFilename
	const filename = await createBundleFilename({
		modules,
		namespace,
		minify,
		autoinit,
		shrinkwrap,
	});
	// createTemporaryDirectory
	const installationDirectory = await createTemporaryDirectory(filename);
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
		namespace,
		autoinit,
	});
	// createBundleFile
	const bundleFile = await createBundleFile({
		installationDirectory,
		entryFile,
		minify,
	});
	const bundleFileContents =
		shrinkwrapComment + (await fs.readFile(bundleFile, "utf8"));
	// deleteDirectory
	// await deleteDirectory(installationDirectory);

	return bundleFileContents;
};
