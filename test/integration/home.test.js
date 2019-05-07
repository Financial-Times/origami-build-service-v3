"use strict";

const request = require("supertest");
const service = require("../../lib/service");

describe("/", function() {
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
	it.skip("GET /", function() {
		return request(app)
			.get("/")
			.expect(302)
			.expect("Location", "/v3/");
	});
});
