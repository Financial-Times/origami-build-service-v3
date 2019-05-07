"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure the registry query parameter is either `bower` or `npm`.
 * If registry query parameter does not exist, give it a default value of `bower`.
 *
 * If registry parameter is a valid value, move on to the next middleware.
 * If registry parameter is not valid, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.registry) {
		if (request.query.registry === "") {
			next(httpError(400, "The registry query parameter can not be empty."));
		} else if (!['bower', 'npm'].includes(request.query.registry)) {
			next(
				httpError(
					400,
					"The registry query parameter can only be `bower` or `npm`.",
				),
			);
		} else {
			next();
		}
	} else {
		request.query.registry = "bower";
		next();
	}
};
