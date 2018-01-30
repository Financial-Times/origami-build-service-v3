"use strict";
const querystring = require("querystring");
const deviate = require("deviate");

module.exports = deviate(301, req => {
	const path = req.path.replace(/^\/v1/, "/v2");
	const qs = querystring.stringify(req.query);
	if (qs) {
		return `https://www.ft.com/__origami/service/build${path}?${qs}`;
	} else {
		return `https://www.ft.com/__origami/service/build${path}`;
	}
});
