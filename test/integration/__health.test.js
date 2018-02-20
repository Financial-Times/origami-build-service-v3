"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({
	longStackTraces: true,
});
describe("/__health", function() {
	it("GET /__health", function() {
		return request(this.app)
			.get("/__health")
			.expect(200)
			.expect("content-type", "application/json; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store, private",
			);
	});
});
