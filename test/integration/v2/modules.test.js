"use strict";

const request = require("supertest");

describe("/v2/modules", function() {
	it("GET /v2/modules", function() {
		return request(this.app)
			.get("/v2/modules")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/modules",
			);
	});

	it("GET /v2/modules?cachebust=1", function() {
		return request(this.app)
			.get("/v2/modules?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/modules?cachebust=1",
			);
	});

	it("GET /v2/modules/o-fonts-assets@1.3.0", function() {
		return request(this.app)
			.get("/v2/modules/o-fonts-assets@1.3.0")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/modules/o-fonts-assets@1.3.0",
			);
	});

	it("GET /v2/modules/o-fonts-assets@1.3.0?cachebust=1", function() {
		return request(this.app)
			.get("/v2/modules/o-fonts-assets@1.3.0?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/modules/o-fonts-assets@1.3.0?cachebust=1",
			);
	});
});
