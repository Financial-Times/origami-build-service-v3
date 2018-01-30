"use strict";

const itRespondsWithHeader = require("../../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../../helpers/it-responds-with-status");
const setupRequest = require("../../helpers/setup-request");

describe("/v1/bundles/js", function() {
	describe("GET /v1/bundles/js", function() {
		setupRequest("GET", "/v1/bundles/js");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js",
		);
	});

	describe("GET /v1/bundles/js?modules", function() {
		setupRequest("GET", "/v1/bundles/js?modules");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=",
		);
	});

	describe("GET /v1/bundles/js?modules=,,", function() {
		setupRequest("GET", "/v1/bundles/js?modules=,,");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=%2C%2C",
		);
	});

	describe("GET /v1/bundles/js?modules=1a-", function() {
		setupRequest("GET", "/v1/bundles/js?modules=1a-");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=1a-",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.19", function() {
		setupRequest("GET", "/v1/bundles/js?modules=o-test-component@1.0.19");
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.19",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.17%20-%201.0.19",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.19%2Co-test-component%401.0.19",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.19%2Co-test-component%401.0.17%20-%201.0.19",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.17%2Co-test-component%401.0.19",
		);
	});

	describe("GET /v1/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-autoinit%401.3.3%2Co-test-component%401.0.29",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&export=Test_123", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&export=Test_123",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&export=Test_123",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&export='", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&export='",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&export='",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&export='%5D%3Balert('ha')%2F%2F",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&minify=maybe", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&minify=maybe",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&minify=maybe",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&minify=on", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&minify=on",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&minify=on",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&minify=off", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&minify=off",
		);
		itRespondsWithStatus(301);
		//TODO: Ensure consistent builds when minification is turned off
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&minify=off",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&autoinit=on", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&autoinit=on",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=on",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&autoinit=off", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&autoinit=off",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=off",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=off&minify=off",
		);
	});

	describe("GET /v1/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=7", function() {
		setupRequest(
			"GET",
			"/v1/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=7",
		);
		itRespondsWithStatus(301);
		itRespondsWithHeader(
			"location",
			"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=off&minify=off&export=7",
		);
	});
});
