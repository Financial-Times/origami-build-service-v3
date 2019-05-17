"use strict";

const vm = require("vm");
const proclaim = require("proclaim");
const request = require("supertest");
const service = require("../../../../lib/service");
const isES5 = require("is-es5-syntax");
const isES6 = require("is-es6-syntax");
const isES7 = require("is-es7-syntax");
const { Parser } = require("acorn");
const acornExportNsFrom = require("acorn-export-ns-from");

const containsExportStatement = js => {
	if (!isES7(js)) {
		try {
			Parser.extend(acornExportNsFrom).parse(js, { sourceType: "module" });
			return true;
		} catch (error) {
			return false;
		}
	} else {
		return true;
	}
};
describe("/v3/bundles/js", function() {
	let app;
	beforeEach(() => {
		return service({
			environment: "test",
			log: {
				info: () => {},
				error: () => {},
				warn: () => {},
			},
			port: 0,
		})
			.listen()
			.then(appp => {
				app = appp;
			});
	});
	afterEach(function() {
		return app.ft.server.close();
	});
	context("missing all parameters", function() {
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
	});

	context("invalid modules parameter", function() {
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
	});

	context("invalid esmodules parameter", function() {
		it("GET /v3/bundles/js?esmodules", function() {
			return request(app)
				.get("/v3/bundles/js?esmodules")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});

		it("GET /v3/bundles/js?esmodules=carrot", function() {
			return request(app)
				.get("/v3/bundles/js?esmodules=carrot")
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
				.get("/v3/bundles/js?registry=carrot&source=test")
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
				.get("/v3/bundles/js?modules=o-test-component")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context("npm registry", function() {
		context("basic request", function() {
			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.32-test&source=test&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.32-test&source=test&registry=npm",
					)
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
					.expect("etag", "e59bc417b0d50279f73fac87b290c65b");
			});
		});

		context("requesting the same module multiple times", function() {
			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.19&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.19&registry=npm",
					)
					.expect(400)
					.expect("Content-Type", "text/html; charset=utf-8")
					.expect(
						"cache-control",
						"max-age=0, must-revalidate, no-cache, no-store",
					);
			});

			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.17%20-%201.0.19&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.17%20-%201.0.19&registry=npm",
					)
					.expect(400)
					.expect("Content-Type", "text/html; charset=utf-8")
					.expect(
						"cache-control",
						"max-age=0, must-revalidate, no-cache, no-store",
					);
			});

			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.17,@financial-times/o-test-component@1.0.19&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.17,@financial-times/o-test-component@1.0.19&registry=npm",
					)
					.expect(400)
					.expect("Content-Type", "text/html; charset=utf-8")
					.expect(
						"cache-control",
						"max-age=0, must-revalidate, no-cache, no-store",
					);
			});
		});

		context("requesting two different modules", function() {
			it("GET /v3/bundles/js?modules=@financial-times/o-autoinit@1.5,@financial-times/o-test-component@1.0.29-test&source=test&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-autoinit@1.5,@financial-times/o-test-component@1.0.29-test&source=test&registry=npm",
					)
					.expect(200)
					.expect("etag", "0eacb04a663aae2dab774d18be7dab6c")
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
						proclaim.include(
							sandbox.window.Origami,
							"@financial-times/o-test-component",
						);
						proclaim.include(
							sandbox.window.Origami,
							"@financial-times/o-autoinit",
						);
						proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
					});
			});
		});

		context("invalid module name", function() {
			it("GET /v3/bundles/js?modules=o-autoinit_±-test&source=test&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=o-autoinit_±-test&source=test&registry=npm",
					)
					.expect(400);
			});
		});

		context("invalid minify parameter", function() {
			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.29&minify=maybe&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29&minify=maybe&registry=npm",
					)
					.expect(400)
					.expect("Content-Type", "text/html; charset=utf-8")
					.expect(
						"cache-control",
						"max-age=0, must-revalidate, no-cache, no-store",
					);
			});
		});

		context("valid minify paramters", function() {
			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&minify=on&source=test&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&minify=on&source=test&registry=npm",
					)
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "application/javascript; charset=utf-8")
					.expect(response => {
						const sandbox = {
							globalThis: {},
							self: {},
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
						proclaim.include(
							sandbox.window.Origami,
							"@financial-times/o-test-component",
						);
						proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
					})
					.expect("etag", "616366e148a7eb3c16c3a1718e646dc5");
			});

			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&minify=off&source=test&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&minify=off&source=test&registry=npm",
					)
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "application/javascript; charset=utf-8")
					.expect(response => {
						const sandbox = {
							globalThis: {},
							self: {},
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
						proclaim.include(
							sandbox.window.Origami,
							"@financial-times/o-test-component",
						);
						// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
					});
				// TODO: Ensure consistent builds when minification is turned off
				// .expect("etag", "8d70f72aa6835afec5dbcc3828607879")
			});
		});

		context("attaches modules to the Origami global object", function() {
			it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&registry=npm", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&registry=npm",
					)
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "application/javascript; charset=utf-8")
					.expect(response => {
						const sandbox = {
							globalThis: {},
							self: {},
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
						proclaim.include(
							sandbox.window.Origami,
							"@financial-times/o-test-component",
						);
						proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
					})
					.expect("etag", "616366e148a7eb3c16c3a1718e646dc5");
			});
		});

		context(
			"compiles the JavaScript based upon the user-agent header",
			function() {
				it("compiles to ES5 for user-agents the service is not aware of", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&registry=npm",
						)
						.set("User-Agent", "unknown_browser/1.2.3")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 11", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&registry=npm",
						)
						.set("User-Agent", "ie/11")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 10", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&registry=npm",
						)
						.set("User-Agent", "ie/10")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 or ES6 for Chrome 70", function() {
					// o-test-component 1.0.29 is written in ES7 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&registry=npm",
						)
						.set("User-Agent", "chrome/70")
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isFalse(
								isES6(response.text),
								"expected JavaScript response to not be valid ECMAScript 6 syntax but it was.",
							);
							proclaim.isTrue(
								isES7(response.text),
								"expected JavaScript response to be valid ECMAScript 7 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 for Chrome 70", function() {
					// o-test-component 1.0.32 is written in ES5 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.32-test&source=test&minify=off&registry=npm",
						)
						.set("User-Agent", "chrome/70")
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isTrue(
								isES6(response.text),
								"expected JavaScript response to be valid ECMAScript 6 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});
			},
		);

		context.only(
			"compiles the JavaScript based upon the esmodules query parameter",
			function() {
				it("compiles to ES6 when esmodules query parameter is set to `on`", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&esmodules=on&registry=npm",
						)
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isTrue(
								containsExportStatement(response.text),
								"expected JavaScript response to be ECMAScript Module syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles based upon user-agent header if esmodules query parameter is set to `off`", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&esmodules=off&registry=npm",
						)
						.set("User-Agent", "unknown_browser/1")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles based upon ua query parameter if esmodules query parameter is set to `off`", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&esmodules=off&registry=npm&ua=unknown_browser/1",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});
			},
		);

		context(
			"compiles the JavaScript based upon the ua query parameter",
			function() {
				it("takes precedant over the user-agent header", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&ua=unknown_browser/1.2.3&registry=npm",
						)
						.set("User-Agent", "chrome/70")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for user-agents the service is not aware of", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&ua=unknown_browser/1.2.3&registry=npm",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 11", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&=ie/11&registry=npm",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 10", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&ua=ie/10&registry=npm",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 or ES6 for Chrome 70", function() {
					// @financial-times/o-test-component 1.0.29-test is written in ES7 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.29-test&source=test&minify=off&ua=chrome/70&registry=npm",
						)
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isFalse(
								isES6(response.text),
								"expected JavaScript response to not be valid ECMAScript 6 syntax but it was.",
							);
							proclaim.isTrue(
								isES7(response.text),
								"expected JavaScript response to be valid ECMAScript 7 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 for Chrome 70", function() {
					// @financial-times/o-test-component 1.0.32-test is written in ES5 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=@financial-times/o-test-component@1.0.32-test&source=test&minify=off&ua=chrome/70&registry=npm",
						)
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isTrue(
								isES6(response.text),
								"expected JavaScript response to be valid ECMAScript 6 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});
			},
		);
	});

	context("bower registry", function() {
		it("GET /v3/bundles/js?modules=o-test-component@1.0.32&source=test", function() {
			return request(app)
				.get("/v3/bundles/js?modules=o-test-component@1.0.32&source=test")
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
				.expect("etag", "87af47fbb8b5af7c96219492c7c77681");
		});

		context("handles version ranges", function() {
			it("GET /v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.32&source=test", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=o-test-component@1.0.17%20-%201.0.32&source=test",
					)
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
					.expect("etag", "87af47fbb8b5af7c96219492c7c77681");
			});
		});

		context("requesting the same module multiple times", function() {
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
		});

		context(
			"adds the requested modules to the `Origami` global object",
			function() {
				it("GET /v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29&source=test", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29&source=test",
						)
						.expect(200)
						.expect("etag", "cddc19891b43c0e82b49e95abf635649")
						.expect(
							"cache-control",
							"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
						)
						.expect("Content-Type", "application/javascript; charset=utf-8")
						.expect(response => {
							const sandbox = {
								globalThis: {},
								self: {},
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
							proclaim.include(sandbox.window.Origami, "o-test-component");
							proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
						});
				});
			},
		);

		context("invalid module name", function() {
			it("GET /v3/bundles/js?modules=o-autoinit_±&source=test", function() {
				return request(app)
					.get("/v3/bundles/js?modules=o-autoinit_±&source=test")
					.expect(400);
			});
		});

		context("invalid minify parameter", function() {
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
		});

		context("valid minify paramters", function() {
			it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=on&source=test", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=o-test-component@1.0.29&minify=on&source=test",
					)
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "application/javascript; charset=utf-8")
					.expect(response => {
						const sandbox = {
							globalThis: {},
							self: {},
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
						proclaim.include(sandbox.window.Origami, "o-test-component");
						proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
					})
					.expect("etag", "7d0e6490aad03b8b795f5fbf297f497f");
			});

			it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=off&source=test", function() {
				return request(app)
					.get(
						"/v3/bundles/js?modules=o-test-component@1.0.29&minify=off&source=test",
					)
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "application/javascript; charset=utf-8")
					.expect(response => {
						const sandbox = {
							globalThis: {},
							self: {},
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
						proclaim.include(sandbox.window.Origami, "o-test-component");
						// proclaim.match(response.text, /\/\/#\ssourceMappingURL(.+)/);
					});
				// TODO: Ensure consistent builds when minification is turned off
				// .expect("etag", "2561e1ea36fd92d7112b95bebcff123f")
			});

			context(
				"minified response is smaller than unminified response",
				function() {
					it("GET /v3/bundles/js?modules=o-test-component@1.0.29&minify=on&source=test", function() {
						return request(app)
							.get(
								"/v3/bundles/js?modules=o-test-component@1.0.29&minify=on&source=test",
							)
							.expect(200)
							.expect(minifiedResponse => {
								return request(app)
									.get(
										"/v3/bundles/js?modules=o-test-component@1.0.29&minify=on&source=test",
									)
									.expect(200)
									.expect(unminifiedResponse => {
										proclaim.lessThan(
											minifiedResponse.text.length,
											unminifiedResponse.text.length,
										);
									});
							});
					});
				},
			);
		});

		context("attaches modules to the Origami global object", function() {
			it("GET /v3/bundles/js?modules=o-test-component@1.0.29&source=test", function() {
				return request(app)
					.get("/v3/bundles/js?modules=o-test-component@1.0.29&source=test")
					.expect(200)
					.expect(
						"cache-control",
						"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
					)
					.expect("Content-Type", "application/javascript; charset=utf-8")
					.expect(response => {
						const sandbox = {
							globalThis: {},
							self: {},
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
						proclaim.include(sandbox.window.Origami, "o-test-component");
						proclaim.notMatch(response.text, /\/\/#\ssourceMappingURL(.+)/);
					})
					.expect("etag", "7d0e6490aad03b8b795f5fbf297f497f");
			});
		});

		context(
			"compiles the JavaScript based upon the user-agent header",
			function() {
				it("compiles to ES5 for user-agents the service is not aware of", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off",
						)
						.set("User-Agent", "unknown_browser/1.2.3")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 11", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off",
						)
						.set("User-Agent", "ie/11")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 10", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off",
						)
						.set("User-Agent", "ie/10")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 or ES6 for Chrome 70", function() {
					// o-test-component 1.0.29 is written in ES7 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off",
						)
						.set("User-Agent", "chrome/70")
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isFalse(
								isES6(response.text),
								"expected JavaScript response to not be valid ECMAScript 6 syntax but it was.",
							);
							proclaim.isTrue(
								isES7(response.text),
								"expected JavaScript response to be valid ECMAScript 7 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 for Chrome 70", function() {
					// o-test-component 1.0.32 is written in ES5 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.32&source=test&minify=off",
						)
						.set("User-Agent", "chrome/70")
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isTrue(
								isES6(response.text),
								"expected JavaScript response to be valid ECMAScript 6 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});
			},
		);

		context.only(
			"compiles the JavaScript based upon the esmodules query parameter",
			function() {
				it("compiles to ES6 when esmodules query parameter is set to `on`", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&esmodules=on",
						)
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isTrue(
								containsExportStatement(response.text),
								"expected JavaScript response to be valid ECMAScript Module syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles based upon user-agent header if esmodules query parameter is set to `off`", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&esmodules=off",
						)
						.set("User-Agent", "unknown_browser/1")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles based upon ua query parameter if esmodules query parameter is set to `off`", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&esmodules=off&ua=unknown_browser/1",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});
			},
		);

		context(
			"compiles the JavaScript based upon the ua query parameter",
			function() {
				it("takes precedant over the user-agent header", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&ua=unknown_browser/1.2.3",
						)
						.set("User-Agent", "chrome/70")
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for user-agents the service is not aware of", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&ua=unknown_browser/1.2.3",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 11", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&=ie/11",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("compiles to ES5 for Internet Explorer 10", function() {
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&ua=ie/10",
						)
						.expect(response => {
							proclaim.isTrue(
								isES5(response.text),
								"expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 or ES6 for Chrome 70", function() {
					// o-test-component 1.0.29 is written in ES7 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.29&source=test&minify=off&ua=chrome/70",
						)
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isFalse(
								isES6(response.text),
								"expected JavaScript response to not be valid ECMAScript 6 syntax but it was.",
							);
							proclaim.isTrue(
								isES7(response.text),
								"expected JavaScript response to be valid ECMAScript 7 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});

				it("does not compile to ES5 for Chrome 70", function() {
					// o-test-component 1.0.32 is written in ES5 syntax
					return request(app)
						.get(
							"/v3/bundles/js?modules=o-test-component@1.0.32&source=test&minify=off&ua=chrome/70",
						)
						.expect(response => {
							proclaim.isFalse(
								isES5(response.text),
								"expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
							);
							proclaim.isTrue(
								isES6(response.text),
								"expected JavaScript response to be valid ECMAScript 6 syntax but it was not.",
							);
						});
					// .expect("etag", "a7c4c23840cef2aa78288a6b32027b0d");
				});
			},
		);
	});
});
