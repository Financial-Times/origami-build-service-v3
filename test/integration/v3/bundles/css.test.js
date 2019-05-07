"use strict";

const request = require("supertest");
const proclaim = require("proclaim");
const service = require("../../../../lib/service");

const app = service({
	environment: "test",
	log: {
		info: () => {},
		error: () => {},
		warn: () => {},
	},
	port: 0,
});

describe("/v3/bundles/css", function() {
	context("missing all parameters", function() {
		it("GET /v3/bundles/css", () => {
			return request(app)
				.get("/v3/bundles/css")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context("invalid modules parameter", function() {
		it("GET /v3/bundles/css?modules", () => {
			return request(app)
				.get("/v3/bundles/css?modules")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});

		it("GET /v3/bundles/css?modules=,,", () => {
			return request(app)
				.get("/v3/bundles/css?modules=,,")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});

		it("GET /v3/bundles/css?modules=1a-", () => {
			return request(app)
				.get("/v3/bundles/css?modules=1a-")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context("invalid registry parameter", function() {
		it("returns an error", function() {
			return request(app)
				.get("/v3/bundles/css?registry=carrot&source=test")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context("missing source parameter", function() {
		it("returns an error", function() {
			return request(app)
				.get("/v3/bundles/css?modules=o-test-component")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context("npm registry", function() {
		it("returns error because we do not yet support css via npm", function() {
			return request(app)
				.get("/v3/bundles/css?modules=o-test-component&registry=npm")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		})
	})

	context("bower registry", function() {
		it("GET /v3/bundles/css?modules=o-test-component@1.0.19&source=test", () => {
			return request(app)
				.get("/v3/bundles/css?modules=o-test-component@1.0.19&source=test")
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
				})
				.expect("etag", "d41d8cd98f00b204e9800998ecf8427e");
		});

		it("GET /v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19&source=test", () => {
			return request(app)
				.get(
					"/v3/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19&source=test",
				)
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
				})
				.expect("etag", "d41d8cd98f00b204e9800998ecf8427e");
		});

		context("requesting the same module multiple times", function() {
			it("GET /v3/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19", () => {
				return request(app)
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
				return request(app)
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
				return request(app)
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
		});

		context("invalid module name", function() {
			it("GET /v3/bundles/css?modules=o-autoinit_±|&source=test", function() {
				return request(app)
					.get("/v3/bundles/css?modules=o-autoinit_±|&source=test")
					.expect(400);
			});
		});

		it("GET /v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29&source=test", () => {
			return request(app)
				.get(
					"/v3/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29&source=test",
				)
				.expect(200)
				.expect("etag", "5b1f99cce840d1881d89902c54418f96")
				.expect(
					"cache-control",
					"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
				)
				.expect("Content-Type", "text/css; charset=utf-8")
				.expect(response => {
					proclaim.isString(response.text);
				});
		});

		context("invalid minify parameter", function() {
			it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe", () => {
				return request(app)
					.get("/v3/bundles/css?modules=o-test-component@1.0.29&minify=maybe")
					.expect(400)
					.expect("Content-Type", "text/html; charset=utf-8")
					.expect(
						"cache-control",
						"max-age=0, must-revalidate, no-cache, no-store",
					);
			});
		});

		context("valid minify paramters", function() {
			it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=on&source=test", () => {
				return request(app)
					.get(
						"/v3/bundles/css?modules=o-test-component@1.0.29&minify=on&source=test",
					)
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "text/css; charset=utf-8")
					.expect(response => {
						proclaim.isString(response.text);
					});
			});

			it("GET /v3/bundles/css?modules=o-test-component@1.0.29&minify=off&source=test", () => {
				return request(app)
					.get(
						"/v3/bundles/css?modules=o-test-component@1.0.29&minify=off&source=test",
					)
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
  color: red;
}`,
						);
					});
			});
		});
	});
});
