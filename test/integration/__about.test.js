"use strict";

const request = require("supertest");
const service = require("../../lib/service");

describe("/__about", function() {
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
	it("GET /__about", function() {
		return request(app)
			.get("/__about")
			.expect(200)
			.expect("content-type", "application/json; charset=utf-8");
	});
});
