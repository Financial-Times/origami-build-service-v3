"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });
const proclaim = require("proclaim");

describe("/v3/bundles/css", function() {
	it("GET /v3/bundles/css", function() {
		return request(this.app)
			.get("/v3/bundles/css")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=,,", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=,,")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=1a-", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=1a-")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.19", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.19")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "text/css; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "d41d8cd98f00b204e9800998ecf8427e");
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "text/css; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "d41d8cd98f00b204e9800998ecf8427e");
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		return request(this.app)
			.get(
				"/v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
			.get(
				"/v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		return request(this.app)
			.get(
				"/v3/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29")
			.expect(200)
			.expect("etag", "b012ee3b8ce835fa47c4b09d9d97c6f6")
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "text/css; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=on", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.29&minify=on")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "text/css; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.notMatch(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "b012ee3b8ce835fa47c4b09d9d97c6f6");
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=off", function() {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.29&minify=off")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "text/css; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.match(
					response.text,
					/\/\*# sourceMappingURL=data:application\/json;base64,(.+)/,
				);
				proclaim.include(
					response.text,
					`.test-compile-error {
  color: red; }`,
				);
			});
		// TODO: Ensure consistent builds when minification is turned off
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "1a331559de933cfef085f95a4603602e");
	});
});
