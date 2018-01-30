"use strict";

const itRespondsWithHeader = require("./helpers/it-responds-with-header");
const itRespondsWithStatus = require("./helpers/it-responds-with-status");
const setupRequest = require("./helpers/setup-request");

describe("/demos", function() {
	describe("GET /demos", function() {
		setupRequest("GET", "/demos");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos",
		);
	});

	describe("GET /demos?cachebust=1", function() {
		setupRequest("GET", "/demos?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos?cachebust=1",
		);
	});

	describe("GET /demos/o-buttons@5.8.5/B2C", function() {
		setupRequest("GET", "/demos/o-buttons@5.8.5/B2C");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C",
		);
	});

	describe("GET /demos/o-buttons@5.8.5/B2C?cachebust=1", function() {
		setupRequest("GET", "/demos/o-buttons@5.8.5/B2C?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C?cachebust=1",
		);
	});
});
