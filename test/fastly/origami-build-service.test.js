"use strict";

const process = require("process");
const request = require("supertest");
const host = process.env.HOST || "https://origami-build-service.in.ft.com";
const proclaim = require("proclaim");

describe("Origami-build-service", function() {
	this.timeout(30000);

	describe("cache key logic", () => {
		it("does not include the source query parameter in the cache key", () => {
			const path = "/v3/bundles/js?modules=o-header";
			return request(host)
				.get(`${path}?source=vcl-test`)
				.set("Fastly-Debug", "true")
				.expect(200)
				.then(response => {
					const digest = response.headers["fastly-debug-digest"];
					return request(host)
						.get(`${path}?source=${Math.random()}`)
						.set("Fastly-Debug", "true")
						.expect("Fastly-Debug-Digest", digest)
						.expect("X-Cache", /\bHIT\b/)
						.expect(200);
				});
		});

		it("does include whether the source parameter existed at all", () => {
			const path = "/v3/bundles/js?modules=o-header";
			return request(host)
				.get(`${path}`)
				.set("Fastly-Debug", "true")
				.then(response => {
					const digestWithoutSourceParameter =
						response.headers["fastly-debug-digest"];
					return request(host)
						.get(`${path}?source=${Math.random()}`)
						.set("Fastly-Debug", "true")
						.then(response => {
							const digestWithSourceParameter =
								response.headers["fastly-debug-digest"];
							proclaim.notStrictEqual(
								digestWithoutSourceParameter,
								digestWithSourceParameter,
							);
						});
				});
		});
	});
});
