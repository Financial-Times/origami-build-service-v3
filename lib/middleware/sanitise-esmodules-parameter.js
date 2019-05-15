"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure the esmodules query parameter is either `on` or `off`.
 *
 * If esmodules parameter is a valid value, move on to the next middleware.
 * If esmodules parameter is not valid, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.esmodules) {
		if (request.query.esmodules === "") {
			next(httpError(400, "The esmodules query parameter can not be empty."));
		} else if (!/^(on|off)$/.test(request.query.esmodules)) {
			next(
				httpError(
					400,
					"The esmodules query parameter can only be `on` or `off`.",
				),
			);
		} else {
			next();
		}
	} else {
		request.query.esmodules = "off";
		next();
	}
};
