"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });

describe("/bundles/js", function() {
	it("GET /bundles/js", function() {
		return request(this.app)
			.get("/bundles/js")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js",
			);
	});

	it("GET /bundles/js?modules", function() {
		return request(this.app)
			.get("/bundles/js?modules")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=",
			);
	});

	it("GET /bundles/js?modules=,,", function() {
		return request(this.app)
			.get("/bundles/js?modules=,,")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=%2C%2C",
			);
	});

	it("GET /bundles/js?modules=1a-", function() {
		return request(this.app)
			.get("/bundles/js?modules=1a-")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=1a-",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.19", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.19")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.19",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.17%20-%201.0.19")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.17%20-%201.0.19",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		return request(this.app)
			.get(
				"/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.19",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.19%2Co-test-component%401.0.19",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
			.get(
				"/bundles/js?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.19%2Co-test-component%401.0.17%20-%201.0.19",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		return request(this.app)
			.get(
				"/bundles/js?modules=o-test-component@1.0.17,o-test-component@1.0.19",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.17%2Co-test-component%401.0.19",
			);
	});

	it("GET /bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-autoinit@1.3.3,o-test-component@1.0.29")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-autoinit%401.3.3%2Co-test-component%401.0.29",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&export=Test_123", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&export=Test_123")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&export=Test_123",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&export='", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&export='")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&export='",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//", function() {
		return request(this.app)
			.get(
				"/bundles/js?modules=o-test-component@1.0.29&export=%27];alert(%27ha%27)//",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&export='%5D%3Balert('ha')%2F%2F",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&minify=maybe", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&minify=maybe")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&minify=maybe",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&minify=on", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&minify=on")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&minify=on",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&minify=off", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&minify=off")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&minify=off",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&autoinit=on", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&autoinit=on")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=on",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&autoinit=off", function() {
		return request(this.app)
			.get("/bundles/js?modules=o-test-component@1.0.29&autoinit=off")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=off",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off", function() {
		return request(this.app)
			.get(
				"/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=off&minify=off",
			);
	});

	it("GET /bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=7", function() {
		return request(this.app)
			.get(
				"/bundles/js?modules=o-test-component@1.0.29&autoinit=off&minify=off&export=7",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%401.0.29&autoinit=off&minify=off&export=7",
			);
	});
});
