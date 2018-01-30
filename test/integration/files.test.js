"use strict";

const itRespondsWithHeader = require("./helpers/it-responds-with-header");
const itRespondsWithStatus = require("./helpers/it-responds-with-status");
const setupRequest = require("./helpers/setup-request");

describe("/files", function() {
	describe("GET /files", function() {
		setupRequest("GET", "/files");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/files",
		);
	});

	describe("GET /files?cachebust=1", function() {
		setupRequest("GET", "/files?cachebust=1");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/files?cachebust=1",
		);
	});

	describe("GET /files/o-fonts-assets@1.3.0/BentonSans-Light.woff", function() {
		setupRequest("GET", "/files/o-fonts-assets@1.3.0/BentonSans-Light.woff");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/files/o-fonts-assets@1.3.0/BentonSans-Light.woff",
		);
	});

	describe("GET /files/o-fonts-assets@1.3.0/BentonSans-Light.woff?cachebust=1", function() {
		setupRequest(
			"GET",
			"/files/o-fonts-assets@1.3.0/BentonSans-Light.woff?cachebust=1",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/files/o-fonts-assets@1.3.0/BentonSans-Light.woff?cachebust=1",
		);
	});
});
