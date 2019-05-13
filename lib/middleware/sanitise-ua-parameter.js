"use strict";

const httpError = require("http-errors");
const UA = require("@financial-times/polyfill-useragent-normaliser");

/**
 * Middleware used to ensure the ua query parameter is in the format we expect.
 *
 * If ua parameter exists, pass it in as an argument to `@financial-times/polyfill-useragent-normaliser` and set the parameter as the return result.
 * If ua parameter does not exist, pass the user-agent header to `@financial-times/polyfill-useragent-normaliser` and set the parameter as the return result.
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
