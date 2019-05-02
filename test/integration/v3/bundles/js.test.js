"use strict";

const vm = require("vm");
const proclaim = require("proclaim");
const request = require("supertest");
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

describe("/v3/bundles/js", function() {
	it("GET /v3/bundles/js", function() {
		return request(app)
			.get("/v3/bundles/js")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules", function() {
		return request(app)
			.get("/v3/bundles/js?modules")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=,,", function() {
		return request(app)
			.get("/v3/bundles/js?modules=,,")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=1a-", function() {
		return request(app)
			.get("/v3/bundles/js?modules=1a-")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.19", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.19")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => new vm.Script(response.text));
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			})
			.expect("etag", "cee79c9c3f96d2b631f4af22f2cdb9c8");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => new vm.Script(response.text));
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			})
			.expect("etag", "cee79c9c3f96d2b631f4af22f2cdb9c8");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		return request(app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		return request(app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		return request(app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29")
			.expect(200)
			.expect("etag", "ca817cedc98be875785e4a85262d810f")
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=maybe", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=maybe")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=on", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=on")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			})
			.expect("etag", "0f1c8dfdc06e4d4e89a30b0df0d67b5a");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=off", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=off")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: Ensure consistent builds when minification is turned off
		// .expect("etag", "2561e1ea36fd92d7112b95bebcff123f");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			})
			.expect("etag", "0f1c8dfdc06e4d4e89a30b0df0d67b5a");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29")
			.expect(200)
			.expect("etag", "0f1c8dfdc06e4d4e89a30b0df0d67b5a")
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=off", function() {
		return request(app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=off")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
					globalThis: {},
					window: {
						addEventListener: () => {},
					},
					document: {
						addEventListener: () => {},
					},
				};
				vm.createContext(sandbox);
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.Origami, "o-test-component");
				// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: Ensure consistent builds when minification is turned off
		// .expect("etag", "72e69fb6f913c500a5052ae500f28615");
	});
});
