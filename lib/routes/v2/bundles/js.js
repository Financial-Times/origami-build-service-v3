"use strict";
const querystring = require("querystring");
const deviate = require("deviate");

module.exports = deviate(301, req => {
	const qs = querystring.stringify(req.query);
	if (qs) {
		return `https://www.ft.com/__origami/service/build/v2/bundles/js?${qs}`;
	} else {
		return `https://www.ft.com/__origami/service/build/v2/bundles/js`;
	}
});
