"use strict";

const request = require("supertest");

describe("/v2/bundles/css", function() {
	it("GET /v2/bundles/css", function() {
		return request(this.app)
			.get("/v2/bundles/css")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css",
			);
	});

	it("GET /v2/bundles/css?modules", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=",
			);
	});

	it("GET /v2/bundles/css?modules=,,", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=,,")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=%2C%2C",
			);
	});

	it("GET /v2/bundles/css?modules=1a-", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=1a-")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=1a-",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.19", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=o-test-component@1.0.19")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.19",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=o-test-component@1.0.17%20-%201.0.19")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.17%20-%201.0.19",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19", function() {
		return request(this.app)
			.get(
				"/v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.19",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.19%2Co-test-component%401.0.19",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19", function() {
		return request(this.app)
			.get(
				"/v2/bundles/css?modules=o-test-component@1.0.19,o-test-component@1.0.17%20-%201.0.19",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.19%2Co-test-component%401.0.17%20-%201.0.19",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19", function() {
		return request(this.app)
			.get(
				"/v2/bundles/css?modules=o-test-component@1.0.17,o-test-component@1.0.19",
			)
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.17%2Co-test-component%401.0.19",
			);
	});

	it("GET /v2/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=o-autoinit@1.3.3,o-test-component@1.0.29")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-autoinit%401.3.3%2Co-test-component%401.0.29",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.29&minify=maybe", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=o-test-component@1.0.29&minify=maybe")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.29&minify=maybe",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.29&minify=on", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=o-test-component@1.0.29&minify=on")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.29&minify=on",
			);
	});

	it("GET /v2/bundles/css?modules=o-test-component@1.0.29&minify=off", function() {
		return request(this.app)
			.get("/v2/bundles/css?modules=o-test-component@1.0.29&minify=off")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%401.0.29&minify=off",
			);
	});
});
