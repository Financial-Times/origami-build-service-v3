"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure the minify query parameter is either `on` or `off`.
 *
 * If minify parameter is a valid value, move on to the next middleware.
 * If minify parameter is not valid, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.minify) {
		if (request.query.minify === "") {
			next(httpError(400, "The minify query parameter can not be empty."));
		} else if (!/^(on|off)$/.test(request.query.minify)) {
			next(
				httpError(400, "The minify query parameter can only be `on` or `off`."),
			);
		} else {
			next();
		}
	} else {
		request.query.minify = "on";
		next();
	}
};
