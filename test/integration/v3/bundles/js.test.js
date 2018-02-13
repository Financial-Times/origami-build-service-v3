"use strict";

const vm = require("vm");
const proclaim = require("proclaim");
const itRespondsWithContentType = require("../../helpers/it-responds-with-content-type");
const itRespondsWithHeader = require("../../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../../helpers/it-responds-with-status");
const setupRequest = require("../../helpers/setup-request");

describe("/v3/bundles/js", function() {
	describe("GET /v3/bundles/js", function() {
		setupRequest("GET", "/v3/bundles/js");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules", function() {
		setupRequest("GET", "/v3/bundles/js?modules");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=,,", function() {
		setupRequest("GET", "/v3/bundles/js?modules=,,");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=1a-", function() {
		setupRequest("GET", "/v3/bundles/js?modules=1a-");
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.19", function() {
		setupRequest("GET", "/v3/bundles/js?modules=o-test-component@1.0.19");
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "9f423f740d2af1a094a6aa350dac941b");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => new vm.Script(response.text));
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "9f423f740d2af1a094a6aa350dac941b");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => new vm.Script(response.text));
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29",
		);
		itRespondsWithStatus(200);
		itRespondsWithHeader("etag", "c9134925d89ca2af09e9d2b5adcdb465");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Origami, "o-autoinit");
				proclaim.include(sandbox.window.Origami, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&export=Test_123", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&export=Test_123",
		);
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "9b101deb7ecf8f5c3168eab59a36eb61");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Test_123, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&export='", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&export='",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=maybe", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&minify=maybe",
		);
		itRespondsWithStatus(400);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=on", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&minify=on",
		);
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "00853684018018eebeffa9f9a1abbd0b");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Origami, "o-test-component");
				proclaim.include(sandbox.window.Origami, "o-autoinit");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=off", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&minify=off",
		);
		itRespondsWithStatus(200);
		// TODO: Ensure consistent builds when minification is turned off
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "2561e1ea36fd92d7112b95bebcff123f");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Origami, "o-test-component");
				proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
				proclaim.include(
					response.text,
					`window["Origami"] = {};window["Origami"]["o-test-component"] = `,
				);
				proclaim.include(
					response.text,
					`"./bower_components/o-test-component/main.js"`,
				);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=on", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=on",
		);
		itRespondsWithStatus(200);
		// TODO: As o-autoinit will be included in the bundle, the etag will change whenever a new version of o-autoinit is released.
		// itRespondsWithHeader("etag", "00853684018018eebeffa9f9a1abbd0b");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Origami, "o-test-component");
				proclaim.include(sandbox.window.Origami, "o-autoinit");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off",
		);
		itRespondsWithStatus(200);
		itRespondsWithHeader("etag", "7cdd80c78740d9b8f59fdd59c146f303");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Origami, "o-test-component");
				proclaim.doesNotInclude(sandbox.window.Origami, "o-autoinit");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off",
		);
		itRespondsWithStatus(200);
		// TODO: Ensure consistent builds when minification is turned off
		// itRespondsWithHeader("etag", "72e69fb6f913c500a5052ae500f28615");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window.Origami, "o-test-component");
				proclaim.doesNotInclude(sandbox.window.Origami, "o-autoinit");
				proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});

	describe("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=7", function() {
		setupRequest(
			"GET",
			"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=7",
		);
		itRespondsWithStatus(200);
		// TODO: Ensure consistent builds when minification is turned off
		// itRespondsWithHeader("etag", "604cc3f009c012e8709d23325a9f7a08");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);
		itRespondsWithContentType("application/javascript");
		it("responds with valid javascript", function() {
			const sandbox = {
				window: {
					addEventListener: () => {},
				},
				document: {
					addEventListener: () => {},
				},
			};
			vm.createContext(sandbox);

			return this.request.expect(response => {
				proclaim.isString(response.text);
				proclaim.doesNotThrow(() => {
					vm.runInContext(response.text, sandbox);
				});
				proclaim.include(sandbox.window["7"], "o-test-component");
				proclaim.doesNotInclude(sandbox.window["7"], "o-autoinit");
				proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		});
	});
});
