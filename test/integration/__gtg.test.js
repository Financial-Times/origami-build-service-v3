"use strict";

const proclaim = require("proclaim");
const request = require("supertest");
const service = require("../../lib/service");

describe("/__gtg", function() {
	let app;
	beforeEach(() => {
		return service({
			environment: "test",
			log: {
				info: () => {},
				error: () => {},
				warn: () => {},
			},
			port: 0,
		})
			.listen()
			.then(appp => {
				app = appp;
			});
	});
	afterEach(function() {
		return app.ft.server.close();
	});
	it("GET /__gtg", function() {
		return request(app)
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
