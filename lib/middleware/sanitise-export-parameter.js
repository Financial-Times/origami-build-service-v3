"use strict";

const httpError = require("http-errors");

module.exports = (request, response, next) => {
	if (request.query.export) {
		if (request.query.export === "") {
			next(httpError(400, "The export query parameter can not be empty."));
		} else if (!/^[a-zA-Z0-9_]+$/.test(request.query.export)) {
			next(
				httpError(
					400,
					"The export query parameter can only contain underscore, period, and alphanumeric characters.",
				),
			);
		} else {
			next();
		}
	} else {
		request.query.export = "Origami";
		next();
	}
};
