"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });

describe("/demos", function() {
	it("GET /demos", function() {
		return request(this.app)
			.get("/demos")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos",
			);
	});

	it("GET /demos?cachebust=1", function() {
		return request(this.app)
			.get("/demos?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos?cachebust=1",
			);
	});

	it("GET /demos/o-buttons@5.8.5/B2C", function() {
		return request(this.app)
			.get("/demos/o-buttons@5.8.5/B2C")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C",
			);
	});

	it("GET /demos/o-buttons@5.8.5/B2C?cachebust=1", function() {
		return request(this.app)
			.get("/demos/o-buttons@5.8.5/B2C?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/demos/o-buttons@5.8.5/B2C?cachebust=1",
			);
	});
});
