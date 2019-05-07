"use strict";

const request = require("supertest");
const service = require("../../../../lib/service");

describe("/v3/files", function() {
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
	context("invalid registry parameter", function() {
		it("GET /v3/files/o-test-component@1.0.13/readme.md?registry=carrot&source=test", function() {
			return request(app)
				.get(
					"/v3/files/o-test-component@1.0.13/readme.md?registry=carrot&source=test",
				)
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context("missing source parameter", function() {
		it("returns an error", function() {
			return request(app)
				.get("/v3/files/o-test-component@1.0.13/readme.md")
				.expect(400)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				);
		});
	});

	context.skip("bower registry", function() {
		it("works correctly for files which exist within a component", function() {
			return request(app)
				.get("/v3/files/o-test-component@1.0.13/readme.md")
				.expect(200)
				.expect("Content-Type", "text/markdown; charset=utf-8")
				.expect(
					"cache-control",
					"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
				)
				.expect(
					"o-test-component\n=================\n\nThis component is used to aid in testing the Origami tooling systems.\n\n- [Usage](#usage)\n- [Contact](#contact)\n- [Licence](#licence)\n\n## Usage\n\nThis module should not be used by any teams other than Origami.\n\nEach release of this component is used to test a different scenario in the Origami services.\n\n---\n\n## Contact\n\nIf you have any questions or comments about this component, or need help using it, please either [raise an issue](https://github.com/Financial-Times/o-test-component/issues), visit [#ft-origami](https://financialtimes.slack.com/messages/ft-origami/) or email [Origami Support](mailto:origami-support@ft.com).\n\n----\n\n## Licence\n\nThis software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).\n",
				);
		});

		it("works correctly for files which do not exist within a component which has not specified an explicit version", function() {
			return request(app)
				.get("/v3/files/o-test-component/NOTAFILE")
				.expect(404)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				)
				.expect(/the path notafile does not exist in the repo/i);
		});

		it("works correctly for files which do not exist within a component", function() {
			return request(app)
				.get("/v3/files/o-test-component@1.0.0/NOTAFILE")
				.expect(404)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				)
				.expect(/the path notafile does not exist in the repo/i);
		});

		it("works correctly for components which do not exist", function() {
			return request(app)
				.get("/v3/files/test-404/README.md")
				.expect(404)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				)
				.expect(/package .* not found/i);
		});
	});

	context("npm registry", function() {
		context("invalid module name", function() {
			it("GET /v3/files/o-autoinit_±/readme.md1?source=test&registry=npm", function() {
				return request(app)
					.get("/v3/bundles/js?modules=o-autoinit_±&source=test&registry=npm")
					.expect(400);
			});
		});

		it("works correctly for files which exist within a component", function() {
			return request(app)
				.get(
					"/v3/files/o-test-component@1.0.13/readme.md?registry=npm&source=test",
				)
				.expect(200)
				.expect("Content-Type", "text/markdown; charset=utf-8")
				.expect(
					"cache-control",
					"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
				)
				.expect(
					"o-test-component\n=================\n\nThis component is used to aid in testing the Origami tooling systems.\n\n- [Usage](#usage)\n- [Contact](#contact)\n- [Licence](#licence)\n\n## Usage\n\nThis module should not be used by any teams other than Origami.\n\nEach release of this component is used to test a different scenario in the Origami services.\n\n---\n\n## Contact\n\nIf you have any questions or comments about this component, or need help using it, please either [raise an issue](https://github.com/Financial-Times/o-test-component/issues), visit [#ft-origami](https://financialtimes.slack.com/messages/ft-origami/) or email [Origami Support](mailto:origami-support@ft.com).\n\n----\n\n## Licence\n\nThis software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).\n",
				);
		});

		it("works correctly for files which do not exist within a component which has not specified an explicit version", function() {
			return request(app)
				.get("/v3/files/o-test-component/NOTAFILE?registry=npm&source=test")
				.expect(404)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				)
				.expect(/the path notafile does not exist in the repo/i);
		});

		it("works correctly for files which do not exist within a component", function() {
			return request(app)
				.get(
					"/v3/files/o-test-component@1.0.0/NOTAFILE?registry=npm&source=test",
				)
				.expect(404)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				)
				.expect(/the path notafile does not exist in the repo/i);
		});

		it("works correctly for components which do not exist", function() {
			return request(app)
				.get("/v3/files/test-404/README.md?registry=npm&source=test")
				.expect(404)
				.expect("Content-Type", "text/html; charset=utf-8")
				.expect(
					"cache-control",
					"max-age=0, must-revalidate, no-cache, no-store",
				)
				.expect(/package .* not found/i);
		});
	});
});
