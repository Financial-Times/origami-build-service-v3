"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });

describe("/", function() {
	it.skip("GET /", function() {
		return request(this.app)
			.get("/")
			.expect(302)
			.expect("Location", "/v3/");
	});
});
