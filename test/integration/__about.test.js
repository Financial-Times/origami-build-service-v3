"use strict";

const request = require("supertest");

describe("/__about", function() {
	it("GET /__about", function() {
		return request(this.app)
			.get("/__about")
			.expect(200)
			.expect("content-type", "application/json; charset=utf-8");
	});
});
