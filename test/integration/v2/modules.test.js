"use strict";

const itRespondsWithHeader = require("../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../helpers/it-responds-with-status");
const setupRequest = require("../helpers/setup-request");

describe("/v2/modules", function() {
	describe("GET /v2/modules", function() {
		setupRequest("GET", "/v2/modules");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules",
		);
	});

	describe("GET /v2/modules?cachebust=1", function() {
		setupRequest("GET", "/v2/modules?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules?cachebust=1",
		);
	});

	describe("GET /v2/modules/o-fonts-assets@1.3.0", function() {
		setupRequest("GET", "/v2/modules/o-fonts-assets@1.3.0");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules/o-fonts-assets@1.3.0",
		);
	});

	describe("GET /v2/modules/o-fonts-assets@1.3.0?cachebust=1", function() {
		setupRequest("GET", "/v2/modules/o-fonts-assets@1.3.0?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/modules/o-fonts-assets@1.3.0?cachebust=1",
		);
	});
});
