"use strict";

const itRespondsWithHeader = require("../../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../../helpers/it-responds-with-status");
const setupRequest = require("../../helpers/setup-request");

describe("/v2/bundles/css", function() {
	describe("GET /v2/bundles/css", function() {
		setupRequest("GET", "/v2/bundles/css");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css",
		);
	});

	describe("GET /v2/bundles/css?modules", function() {
		setupRequest("GET", "/v2/bundles/css?modules");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=",
		);
	});

	describe("GET /v2/bundles/css?modules=,,", function() {
		setupRequest("GET", "/v2/bundles/css?modules=,,");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=%2C%2C",
		);
	});

	describe("GET /v2/bundles/css?modules=1a-", function() {
		setupRequest("GET", "/v2/bundles/css?modules=1a-");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=1a-",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.19", function() {
		setupRequest("GET", "/v2/bundles/css?modules=o-test-component@1.0.19");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.19",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.17%20-%201.0.19",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.19%2Co-test-component%401.0.19",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.19%2Co-test-component%401.0.17%20-%201.0.19",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.17%2Co-test-component%401.0.19",
		);
	});

	describe("GET /v2/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-autoinit%401.3.3%2Co-test-component%401.0.29",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.29&minify=maybe", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.29&minify=maybe",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.29&minify=maybe",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.29&minify=on", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.29&minify=on",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.29&minify=on",
		);
	});

	describe("GET /v2/bundles/css?modules=o-test-component@1.0.29&minify=off", function() {
		setupRequest(
			"GET",
			"/v2/bundles/css?modules=o-test-component@1.0.29&minify=off",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.29&minify=off",
		);
	});
});
