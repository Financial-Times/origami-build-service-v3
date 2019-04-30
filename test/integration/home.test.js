"use strict";

const request = require("supertest");

describe("/", function() {
	it.skip("GET /", function() {
		return request(this.app)
			.get("/")
			.expect(302)
			.expect("Location", "/v3/");
	});
});
