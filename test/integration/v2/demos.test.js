"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });

describe("/v2/demos", function() {
	it("GET /v2/demos", function() {
		return request(this.app)
			.get("/v2/demos")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos",
			);
	});

	it("GET /v2/demos?cachebust=1", function() {
		return request(this.app)
			.get("/v2/demos?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos?cachebust=1",
			);
	});

	it("GET /v2/demos/o-buttons@5.8.5/B2C", function() {
		return request(this.app)
			.get("/v2/demos/o-buttons@5.8.5/B2C")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C",
			);
	});

	it("GET /v2/demos/o-buttons@5.8.5/B2C?cachebust=1", function() {
		return request(this.app)
			.get("/v2/demos/o-buttons@5.8.5/B2C?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C?cachebust=1",
			);
	});
});
