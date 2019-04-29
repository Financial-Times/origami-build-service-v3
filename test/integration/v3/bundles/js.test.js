"use strict";

const vm = require("vm");
const proclaim = require("proclaim");
const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });

describe.skip("/v3/bundles/js", function() {
	it("GET /v3/bundles/js", function() {
		return request(this.app)
			.get("/v3/bundles/js")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=,,", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=,,")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=1a-", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=1a-")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.19", function() {
		return request(this.app)
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
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "9f423f740d2af1a094a6aa350dac941b");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
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
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "9f423f740d2af1a094a6aa350dac941b");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		return request(this.app)
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
		return request(this.app)
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
		return request(this.app)
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
		return request(this.app)
			.get("/v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29")
			.expect(200)
			.expect("etag", "dd62b855ff6915b384bb8a1926c9cba5")
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-autoinit@1\.3\.3,o-test-component@1\.0\.29&shrinkwrap=\n \*\//,
				);
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&export=Test_123", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&export=Test_123")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.include(sandbox.Test_123, "o-test-component");
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "9b101deb7ecf8f5c3168eab59a36eb61");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&export='", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&export='")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//", function() {
		return request(this.app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//",
			)
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=maybe", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=maybe")
			.expect(400)
			.expect("Content-Type", "text/html; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store",
			);
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=on", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=on")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=o-autoinit%40.*\n \*\//,
				);
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "00853684018018eebeffa9f9a1abbd0b");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=off", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&minify=off")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=o-autoinit%40.*\n \*\//,
				);
				// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
				proclaim.include(response.text, "var Origami = (function () {");
			});
		// TODO: Ensure consistent builds when minification is turned off
		// TODO: As o-autoinit will be included in the bundle by default, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "2561e1ea36fd92d7112b95bebcff123f");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=on", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=on")
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=o-autoinit%40.*\n \*\//,
				);
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: As o-autoinit will be included in the bundle, the etag will change whenever a new version of o-autoinit is released.
		// .expect("etag", "00853684018018eebeffa9f9a1abbd0b");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=on&shrinkwrap=o-autoinit%401.3.3", function() {
		return request(this.app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=on&shrinkwrap=o-autoinit%401.3.3",
			)
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect("etag", "471ee46d8b35209ed4e361e88578193f")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=o-autoinit%401.3.3\n \*\//,
				);
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off", function() {
		return request(this.app)
			.get("/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off")
			.expect(200)
			.expect("etag", "004518894b36cb649627c23c9c5d4248")
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=\n \*\//,
				);
				proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off", function() {
		return request(this.app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off",
			)
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=\n \*\//,
				);
				// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: Ensure consistent builds when minification is turned off
		// .expect("etag", "72e69fb6f913c500a5052ae500f28615");
	});

	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=hello", function() {
		return request(this.app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=hello",
			)
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.include(sandbox["hello"], "o-test-component");
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=\n \*\//,
				);
				// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: Ensure consistent builds when minification is turned off
		// .expect("etag", "604cc3f009c012e8709d23325a9f7a08");
	});
	it("GET /v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=world&shrinkwrap=", function() {
		return request(this.app)
			.get(
				"/v3/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=world&shrinkwrap=",
			)
			.expect(200)
			.expect(
				"cache-control",
				"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
			)
			.expect("Content-Type", "application/javascript; charset=utf-8")
			.expect(response => {
				const sandbox = {
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
				proclaim.include(sandbox["world"], "o-test-component");
				proclaim.match(
					response.text,
					/\/\*\* Shrinkwrap URL:\n \*      \/v3\/bundles\/js\?modules=o-test-component@1\.0\.29&shrinkwrap=\n \*\//,
				);
				// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
			});
		// TODO: Ensure consistent builds when minification is turned off
		// .expect("etag", "604cc3f009c012e8709d23325a9f7a08");
	});
});
