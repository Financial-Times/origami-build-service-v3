"use strict";

const request = require("supertest");
global.Promise = require("bluebird");
Promise.config({ longStackTraces: true });

describe("/files", function() {
	it("GET /files", function() {
		return request(this.app)
			.get("/files")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/files",
			);
	});

	it("GET /files?cachebust=1", function() {
		return request(this.app)
			.get("/files?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/files?cachebust=1",
			);
	});

	it("GET /files/o-fonts-assets@1.3.0/BentonSans-Light.woff", function() {
		return request(this.app)
			.get("/files/o-fonts-assets@1.3.0/BentonSans-Light.woff")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/files/o-fonts-assets@1.3.0/BentonSans-Light.woff",
			);
	});

	it("GET /files/o-fonts-assets@1.3.0/BentonSans-Light.woff?cachebust=1", function() {
		return request(this.app)
			.get("/files/o-fonts-assets@1.3.0/BentonSans-Light.woff?cachebust=1")
			.expect(301)
			.expect(
				"location",
				"https://www.ft.com/__origami/service/build/v2/files/o-fonts-assets@1.3.0/BentonSans-Light.woff?cachebust=1",
			);
	});
});
