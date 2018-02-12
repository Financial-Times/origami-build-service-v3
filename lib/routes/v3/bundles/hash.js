"use strict";

const generateSafeBundleFilename = require("../../../generate-safe-bundle-filename");
const five_minutes = 1000 * 60 * 5;
const one_day = 60 * 60 * 24;
const one_week = one_day * 7;

module.exports = async function(req, res, next) {
	// if (!req.query.source) {
	// 	next(httpError(400, "The source query parameter is required."));
	// 	return;
	// }

	try {
		const filename = await generateSafeBundleFilename({
			modules: req.query.modules.split(","),
			namespace: req.query.export,
			minify: req.query.minify,
			autoinit: req.query.autoinit,
		});
		res.status(200);
		res.set(
			"Cache-Control",
			`public, max-age=${one_day}, stale-if-error=${one_week}, stale-while-revalidate=${five_minutes}`,
		);
		res.set("Normalized-Modules-Filename", filename);
		res.json(filename);
	} catch (e) {
		next(e);
	}
};
