"use strict";

const itRespondsWithHeader = require("./helpers/it-responds-with-header");
const itRespondsWithStatus = require("./helpers/it-responds-with-status");
const setupRequest = require("./helpers/setup-request");

describe("/v1/modules", function() {
	describe("GET /v1/modules", function() {
		setupRequest("GET", "/v1/modules");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules",
		);
	});

	describe("GET /v1/modules?cachebust=1", function() {
		setupRequest("GET", "/v1/modules?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules?cachebust=1",
		);
	});

	describe("GET /v1/modules/o-fonts-assets@1.3.0", function() {
		setupRequest("GET", "/v1/modules/o-fonts-assets@1.3.0");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules/o-fonts-assets@1.3.0",
		);
	});

	describe("GET /v1/modules/o-fonts-assets@1.3.0?cachebust=1", function() {
		setupRequest("GET", "/v1/modules/o-fonts-assets@1.3.0?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules/o-fonts-assets@1.3.0?cachebust=1",
		);
	});
});
