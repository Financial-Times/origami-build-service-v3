"use strict";

const httpError = require("http-errors");
const sanitiseModulesParameterBower = require("./sanitise-modules-parameter-bower");
const sanitiseModulesParameterNpm = require("./sanitise-modules-parameter-npm");

/**
 * Middleware used to ensure all module names in the modules query parameter conform to the specification of the registry being used.
 *
 * If all module names are valid according to registry specification, move on to the next middleware.
 * If any module names are not valid, return an HTTP 400 status code, specifying which module names are invalid.
 */
module.exports = (request, response, next) => {
	switch (request.query.registry) {
		case "bower": {
			sanitiseModulesParameterBower(request, response, next);
			break;
		}
		case "npm": {
			sanitiseModulesParameterNpm(request, response, next);
			break;
		}
		default: {
			next(
				next(
					httpError(
						400,
						"The registry query parameter can only be `bower` or `npm`.",
					),
				),
			);
		}
	}
};
