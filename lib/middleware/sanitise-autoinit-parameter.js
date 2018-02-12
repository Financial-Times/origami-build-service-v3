"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure the autoinit query parameter is either `on` or `off`.
 *
 * If autoinit parameter is a valid value, move on to the next middleware.
 * If autoinit parameter is not valid, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.autoinit) {
		if (request.query.autoinit === "") {
			next(httpError(400, "The autoinit query parameter can not be empty."));
		} else if (!/^(on|off)$/.test(request.query.autoinit)) {
			next(
				httpError(
					400,
					"The autoinit query parameter can only be `on` or `off`.",
				),
			);
		} else {
			next();
		}
	} else {
		request.query.autoinit = "on";
		next();
	}
};
