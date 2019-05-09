"use strict";

const hasha = require("hasha");
const httpError = require("http-errors");
const createBundleBower = require("../../../generate-js-bundle-bower");
const createBundleNpm = require("../../../generate-js-bundle-npm");
const five_minutes = 1000 * 60 * 5;
const one_day = 60 * 60 * 24;
const one_week = one_day * 7;

module.exports = async function(req, res, next) {
	try {
		let bundle;
		switch (req.query.registry) {
			case "bower": {
				bundle = await createBundleBower({
					modules: req.query.modules.split(","),
					minify: req.query.minify,
				});
				break;
			}
			case "npm": {
				bundle = await createBundleNpm({
					modules: req.query.modules.split(","),
					minify: req.query.minify,
				});
				break;
			}
			default: {
				return next(
					httpError(
						400,
						"The registry query parameter can only be `bower` or `npm`.",
					),
				);
			}
		}
		res.status(200);
		res.set(
			"Cache-Control",
			`public, max-age=${one_day}, stale-if-error=${one_week}, stale-while-revalidate=${five_minutes}`,
		);
		res.set("etag", hasha(bundle, { algorithm: "md5" }));
		res.set("content-type", "application/javascript");
		res.send(bundle);
	} catch (e) {
		next(httpError(500, e));
	}
};
