"use strict";

const request = require("supertest");
const proclaim = require("proclaim");

describe("/v3/bundles/css", function() {
	it("GET /v3/bundles/css", () => {
		return request(this.app)
			.get("/v3/bundles/css")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules", () => {
		return request(this.app)
			.get("/v3/bundles/css?modules")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=,,", () => {
		return request(this.app)
			.get("/v3/bundles/css?modules=,,")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=1a-", () => {
		return request(this.app)
			.get("/v3/bundles/css?modules=1a-")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.19", () => {
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

	it("GET /v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19", () => {
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

	it("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19", () => {
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

	it("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", () => {
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

	it("GET /v3/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19", () => {
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

	it("GET /v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29", () => {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/css\?modules=o-autoinit@1\.3\.3,o-test-component@1\.0\.29&shrinkwrap=\n \*\//,
				);
			});
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe", () => {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=on&shrinkwrap=o-autoinit%401.3.3", () => {
		return request(this.app)
			.get("/v3/bundles/css?modules=o-test-component@1.0.29&minify=on")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "text/css; charset=utf-8")
			.expect("etag", "11b0dac9b84449c938c4dc6759c12945")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/css\?modules=o-test-component@1\.0\.29&shrinkwrap=o-autoinit%401\.3\.3\n \*\//,
				);
			});
	});

	it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=off", () => {
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
				proclaim.include(
					response.text,
					`.test-compile-error {
	color: red; }`,
				);
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/css\?modules=o-test-component@1\.0\.29&shrinkwrap=o-autoinit%40.*\n \*\//,
				);
			});
	});
});
