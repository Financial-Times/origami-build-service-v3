"use strict";

const request = require("supertest");
const service = require("../../lib/service");

const app = service({
	environment: "test",
	log: {
		info: () => {},
		error: () => {},
		warn: () => {},
	},
	port: 0,
});

describe("/", function() {
	it.skip("GET /", function() {
		return request(app)
			.get("/")
			.expect(302)
			.expect("Location", "/v3/");
	});
});
