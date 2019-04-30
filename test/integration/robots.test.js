"use strict";

const proclaim = require("proclaim");
const request = require("supertest");

describe("/robots.txt", function() {
	it.skip("GET /robots.txt", function() {
		return request(this.app)
			.get("/robots.txt")
			.expect(200)
			.expect("content-type", "text/plain; charset=utf-8")
			.expect(response => {
				proclaim.isString(response.text);
				proclaim.equal(response.text, "User-agent: *\nDisallow: /v3/bundles/");
			});
	});
});
