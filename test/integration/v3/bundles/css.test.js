"use strict";

const proclaim = require("proclaim");
const itRespondsWithContentType = require("../../helpers/it-responds-with-content-type");
const itRespondsWithHeader = require("../../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../../helpers/it-responds-with-status");
const setupRequest = require("../../helpers/setup-request");

describe("/v3/bundles/css", function() {
	describe("GET /v3/bundles/css", function() {
		setupRequest("GET", "/v3/bundles/css");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules", function() {
		setupRequest("GET", "/v3/bundles/css?modules");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=,,", function() {
		setupRequest("GET", "/v3/bundles/css?modules=,,");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=1a-", function() {
		setupRequest("GET", "/v3/bundles/css?modules=1a-");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.19", function() {
		setupRequest("GET", "/v3/bundles/css?modules=o-test-component@1.0.19");
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "d41d8cd98f00b204e9800998ecf8427e");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("text/css");
		it("responds with valid css", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		});
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "d41d8cd98f00b204e9800998ecf8427e");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("text/css");
		it("responds with valid css", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		});
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29",
		);
		itRespondsWithStatus(200);
		itRespondsWithHeader("etag", "5b1f99cce840d1881d89902c54418f96");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("text/css");
		it("responds with valid css", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		});
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=on", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.29&minify=on",
		);
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "5b1f99cce840d1881d89902c54418f96");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("text/css");
		it("responds with valid css", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		});
	});

	describe("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=off", function() {
		setupRequest(
			"GET",
			"/v3/bundles/css?modules=o-test-component@1.0.29&minify=off",
		);
		itRespondsWithStatus(200);
		// TODO: Ensure consistent builds when minification is turned off
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "1a331559de933cfef085f95a4603602e");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("text/css");
		it("responds with valid css", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.match(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
				proclaim.include(
					response.text,
					`.test-compile-error {
	color: red; }
	/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJvd2VyX2NvbXBvbmVudHMvby10ZXN0LWNvbXBvbmVudC9tYWluLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7RUFDQyxXQUFVLEVBQ1YiLCJmaWxlIjoibWFpbi5jc3MifQ== */`,
				);
			});
		});
	});
});
