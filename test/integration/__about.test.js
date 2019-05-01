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

describe("/__about", function() {
	it("GET /__about", function() {
		return request(app)
			.get("/__about")
			.expect(200)
			.expect("content-type", "application/json; charset=utf-8");
	});
});
