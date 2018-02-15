"use strict";

const proclaim = require("proclaim");
const itRespondsWithContentType = require("../../helpers/it-responds-with-content-type");
const itRespondsWithHeader = require("../../helpers/it-responds-with-header");
const itRespondsWithStatus = require("../../helpers/it-responds-with-status");
const setupRequest = require("../../helpers/setup-request");

describe.only("/v3/files", function() {
	describe("/v3/files/o-test-component@1.0.13/readme.md", function() {
		setupRequest("GET", "/v3/files/o-test-component@1.0.13/readme.md");
		itRespondsWithStatus(200);
		itRespondsWithContentType("text/markdown");
		itRespondsWithHeader(
			"cache-control",
			"public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
		);

		it("should respond with the file contents", function() {
			return this.request.expect(
				"o-test-component\n=================\n\nThis component is used to aid in testing the Origami tooling systems.\n\n- [Usage](#usage)\n- [Contact](#contact)\n- [Licence](#licence)\n\n## Usage\n\nThis module should not be used by any teams other than Origami.\n\nEach release of this component is used to test a different scenario in the Origami services.\n\n---\n\n## Contact\n\nIf you have any questions or comments about this component, or need help using it, please either [raise an issue](https://github.com/Financial-Times/o-test-component/issues), visit [#ft-origami](https://financialtimes.slack.com/messages/ft-origami/) or email [Origami Support](mailto:origami-support@ft.com).\n\n----\n\n## Licence\n\nThis software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).\n",
			);
		});
	});

	describe("/v3/files/o-test-component/NOTAFILE", function() {
		setupRequest("GET", "/v3/files/o-test-component/NOTAFILE");
		itRespondsWithStatus(404);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);

		it("should respond with an error message", function(done) {
			this.request
				.expect(/the path notafile does not exist in the repo/i)
				.end(done);
		});
	});

	describe("/v3/files/o-test-component@1.0.0/NOTAFILE", function() {
		setupRequest("GET", "/v3/files/o-test-component@1.0.0/NOTAFILE");
		itRespondsWithStatus(404);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);

		it("should respond with an error message", function(done) {
			this.request
				.expect(/the path notafile does not exist in the repo/i)
				.end(done);
		});
	});

	describe("/v3/files/test-404/README.md", function() {
		setupRequest("GET", "/v3/files/test-404/README.md");
		itRespondsWithStatus(404);
		itRespondsWithContentType("text/html");
		itRespondsWithHeader(
			"cache-control",
			"max-age=0, must-revalidate, no-cache, no-store",
		);

		it("should respond with an error message", function(done) {
			this.request.expect(/package .* not found/i).end(done);
		});
	});
});
