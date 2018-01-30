"use strict";

const itRespondsWithHeader = require("../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../helpers/it-responds-with-status");
const setupRequest = require("../helpers/setup-request");

describe("/v1/demos", function() {
	describe("GET /v1/demos", function() {
		setupRequest("GET", "/v1/demos");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos",
		);
	});

	describe("GET /v1/demos?cachebust=1", function() {
		setupRequest("GET", "/v1/demos?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos?cachebust=1",
		);
	});

	describe("GET /v1/demos/o-buttons@5.8.5/B2C", function() {
		setupRequest("GET", "/v1/demos/o-buttons@5.8.5/B2C");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C",
		);
	});

	describe("GET /v1/demos/o-buttons@5.8.5/B2C?cachebust=1", function() {
		setupRequest("GET", "/v1/demos/o-buttons@5.8.5/B2C?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C?cachebust=1",
		);
	});
});
