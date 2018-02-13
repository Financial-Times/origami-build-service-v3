"use strict";

const hasha = require("hasha");
const createBundle = require("../../../generate-css-bundle");
const five_minutes = 1000 * 60 * 5;
const one_day = 60 * 60 * 24;
const one_week = one_day * 7;

module.exports = async function(req, res, next) {
	// if (!req.query.source) {
	// 	next(new Error("The source query parameter is required."));
	// 	return;
	// }

	try {
		const bundle = await createBundle({
			modules: req.query.modules.split(","),
			minify: req.query.minify,
		});
		res.status(200);
		res.set(
			"Cache-Control",
			`public, max-age=${one_day}, stale-if-error=${one_week}, stale-while-revalidate=${five_minutes}`,
		);
		res.set("etag", hasha(bundle, { algorithm: "md5" }));
		res.set("content-type", "text/css");
		res.send(bundle);
	} catch (e) {
		next(e);
	}
};
