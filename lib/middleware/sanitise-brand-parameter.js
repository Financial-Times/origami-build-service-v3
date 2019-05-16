"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure the brand query parameter is either `master`, `internal` or `whitelabel`.
 *
 * If brand parameter is a valid value, move on to the next middleware.
 * If brand parameter is not valid, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.brand) {
		if (request.query.brand === "") {
			next(httpError(400, "The brand query parameter can not be empty."));
		} else if (!/^(master|internal|whitelabel)$/.test(request.query.brand)) {
			next(
				httpError(
					400,
					"The brand query parameter can only be `master`, `internal` or `whitelabel`.",
				),
			);
		} else {
			next();
		}
	} else {
		request.query.brand = "master";
		next();
	}
};
