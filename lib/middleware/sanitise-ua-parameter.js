"use strict";

const httpError = require("http-errors");
const UA = require("@financial-times/polyfill-useragent-normaliser");

/**
 * Middleware used to ensure the ua query parameter is either `on` or `off`.
 *
 * If ua parameter is a valid value, move on to the next middleware.
 * If ua parameter is not valid, return an HTTP 400 status code.
 */
module.exports = (request, response, next) => {
	if (request.query.ua) {
		if (request.query.ua === "") {
			next(httpError(400, "The ua query parameter can not be empty."));
		} else {
			const useragent = new UA(request.query.ua);
			// handle the case where we don't detect the browser
			switch (useragent.getFamily()) {
				case "chrome":
				case "firefox":
				case "edge":
					request.query.ua = `${useragent.getFamily()}/${useragent.getVersion()}`;
					break;
				default:
					console.log(
						`not supported: ${useragent.getFamily()}/${useragent.getVersion()}`,
					);
			}
			next();
		}
	} else {
		const useragent = new UA(request.headers["user-agent"]);
		// handle the case where we don't detect the browser
		switch (useragent.getFamily()) {
			case "chrome":
			case "firefox":
			case "edge":
				request.query.ua = `${useragent.getFamily()}/${useragent.getVersion()}`;
				break;
			default:
				console.log(
					`not supported: ${useragent.getFamily()}/${useragent.getVersion()}`,
				);
		}
		response.set("vary", "User-Agent");
		next();
	}
};
