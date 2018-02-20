"use strict";

const proclaim = require("proclaim");
const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({
	longStackTraces: true,
});

describe("/__gtg", function() {
	it("GET /__gtg", function() {
		return request(this.app)
			.get("/__gtg")
			.expect(200)
			.expect("content-type", "text/plain; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store, private",
			)
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.equal(response.text, "OK");
			});
	});
});
