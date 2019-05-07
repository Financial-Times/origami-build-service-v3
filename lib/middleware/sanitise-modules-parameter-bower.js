"use strict";

const httpError = require("http-errors");

/**
 * Middleware used to ensure all module names in the modules query parameter conform to the bower.json specification.
 * https://github.com/bower/spec/blob/master/json.md#name
 *
 * If all module names are valid according to bower, move on to the next middleware.
 * If any module names are not valid, return an HTTP 400 status code, specifying which module names are invalid.
 */
module.exports = (request, response, next) => {
	if (request.query.modules) {
		// Turn query parameter value into an array and remove any empty items.
		const modules = request.query.modules.split(",").filter(m => m !== "");

		if (modules.length === 0) {
			next(httpError(400, "The modules query parameter can not be empty."));
			return;
		}

		const moduleNames = modules.map(module => module.split("@")[0]);

		const invalidModuleNames = moduleNames.filter(
			name => !isValidBowerModuleName(name),
		);

		if (invalidModuleNames.length > 0) {
			next(
				httpError(
					400,
					`The modules query parameter contains module names which are not valid: ${invalidModuleNames.join(
						", ",
					)}.`,
				),
			);
		} else {
			if (moduleNames.length !== new Set(moduleNames).size) {
				next(
					httpError(
						400,
						`The modules query parameter contains duplicate module names.`,
					),
				);
			} else {
				request.query.modules = modules.join(",");
				next();
			}
		}
	} else {
		next(httpError(400, "The modules query parameter is required."));
	}
};

/**
 * Checks a Bower module name conforms to the bower.json specification.
 * @param {String} name A Bower module name.
 * @returns {Boolean} Whether the name parameter is valid according to bower.
 */
function isValidBowerModuleName(name) {
	return (
		name.length <= 50 &&
		/^(?!.*[.\-]{2,})([a-z0-9_][a-z0-9_\.\-]*[a-z0-9_])$/.test(
			name.toLowerCase(),
		)
	);
}
