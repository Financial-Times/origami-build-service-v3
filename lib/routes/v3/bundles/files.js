"use strict";

const hasha = require("hasha");
const httpError = require("http-errors");
const extractFileBower = require("../../../extract-file-from-module-bower");
const extractFileNpm = require("../../../extract-file-from-module-npm");
const five_minutes = 1000 * 60 * 5;
const one_day = 60 * 60 * 24;
const one_week = one_day * 7;
const mime = require("mime-types");

module.exports = async function(req, res, next) {
	try {
		let file;
		switch (req.query.registry) {
			case "bower": {
				file = await extractFileBower({
					module: req.params.module,
					path: req.params.path,
				});
				break;
			}
			case "npm": {
				file = await extractFileNpm({
					module: req.params.module,
					path: req.params.path,
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
		res.set("etag", hasha(file, { algorithm: "md5" }));
		res.set("content-type", mime.contentType(req.params.path));
		res.send(file);
	} catch (error) {
		if (error.code === "ENOENT") {
			return next(
				httpError(
					404,
					`The path ${req.params.path} does not exist in the repo`,
				),
			);
		}
		if (typeof error.stderr === "string") {
			if (error.stderr.includes("code E404")) {
				return next(httpError(404, `Package ${req.params.module} not found`));
			}
			try {
				if (error.stderr.includes("ENOTFOUND")) {
					return next(httpError(404, `Package ${req.params.module} not found`));
				}
			} catch (e) {
				console.error(e);
			}
		}
		next(error);
	}
};
