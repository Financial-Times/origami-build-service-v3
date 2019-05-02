"use strict";

const hasha = require("hasha");
const extractFile = require("../../../extract-file-from-module");
const five_minutes = 1000 * 60 * 5;
const one_day = 60 * 60 * 24;
const one_week = one_day * 7;
const mime = require("mime-types");
const createError = require("http-errors");

module.exports = async function(req, res, next) {
	try {
		const file = await extractFile({
			module: req.params.module,
			path: req.params.path,
		});
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
				createError(
					404,
					`The path ${req.params.path} does not exist in the repo`,
				),
			);
		}
		if (typeof error.stderr === "string") {
			if (JSON.parse(error.stderr)[0].code === "ENOTFOUND") {
				return next(createError(404, `Package ${req.params.module} not found`));
			}
		}
		next(error);
	}
};
