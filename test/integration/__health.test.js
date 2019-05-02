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
describe("/__health", function() {
	it("GET /__health", function() {
		return request(app)
			.get("/__health")
			.expect(200)
			.expect("content-type", "application/json; charset=utf-8")
			.expect(
				"cache-control",
				"max-age=0, must-revalidate, no-cache, no-store, private",
			);
	});
});
