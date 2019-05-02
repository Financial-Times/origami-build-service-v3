"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure the source query parameter exists and has a value.
 *
 * If source parameter has a valid value, move on to the next middleware.
 * If source parameter has no value or does not exist, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.source) {
		if (request.query.source === "") {
			next(httpError(400, "The source query parameter can not be empty."));
		} else {
			next();
		}
	} else {
		next(
			httpError(
				400,
				"The source query parameter must exist and contain a valid system-code.",
			),
		);
	}
};
