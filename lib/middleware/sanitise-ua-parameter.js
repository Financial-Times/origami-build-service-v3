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
			const uaNormaliserToBabelTargets = {
				edge: "edge",
				edge_mob: "edge",
				ie: "ie",
				ie_mob: "ie",
				chrome: "chrome",
				safari: "safari",
				ios_saf: "ios",
				ios_chr: "ios",
				firefox: "firefox",
				firefox_mob: "firefox",
				android: "android",
				opera: "opera",
				op_mob: "opera",
				op_mini: "opera",
				samsung_mob: "samsung",
			};
			const family = uaNormaliserToBabelTargets[useragent.getFamily()];
			if (family) {
				request.query.ua = `${family}/${useragent.getVersion()}`;
			} else {
				delete request.query.ua;
				console.log(
					`not supported: ${useragent.getFamily()}/${useragent.getVersion()}`,
				);
			}
			next();
		}
	} else {
		const useragent = new UA(request.headers["user-agent"]);
		const uaNormaliserToBabelTargets = {
			edge: "edge",
			edge_mob: "edge",
			ie: "ie",
			ie_mob: "ie",
			chrome: "chrome",
			safari: "safari",
			ios_saf: "ios",
			ios_chr: "ios",
			firefox: "firefox",
			firefox_mob: "firefox",
			android: "android",
			opera: "opera",
			op_mob: "opera",
			op_mini: "opera",
			samsung_mob: "samsung",
		};
		const family = uaNormaliserToBabelTargets[useragent.getFamily()];
		if (family) {
			request.query.ua = `${family}/${useragent.getVersion()}`;
		} else {
			console.log(
				`not supported: ${useragent.getFamily()}/${useragent.getVersion()}`,
			);
		}
		response.set("vary", "User-Agent");
		next();
	}
};
