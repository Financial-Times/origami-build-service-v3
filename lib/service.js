"use strict";

global.Promise = require("bluebird");

const origamiService = require("@financial-times/origami-service");
const healthChecks = require("./health-checks");
const sanitiseModulesParameter = require("./middleware/sanitise-modules-parameter");
const sanitiseExportParameter = require("./middleware/sanitise-export-parameter");
const sanitiseMinifyParameter = require("./middleware/sanitise-minify-parameter");
const sanitiseAutoinitParameter = require("./middleware/sanitise-autoinit-parameter");

module.exports = function service(options) {
	options._health = healthChecks(options);
	options.healthCheck = options._health.checks();
	options.goodToGoTest = options._health.gtg();
	options.about = require("../about.json");
	options.defaultLayout = "main";
	if (options.environment !== "production") {
		options.requestLogFormat = "dev";
		Promise.config({
			longStackTraces: true,
		});
	}

	const app = origamiService(options);

	app.use(origamiService.middleware.getBasePath());
	mountRoutes(app);
	app.use(origamiService.middleware.notFound());
	app.use(origamiService.middleware.errorHandler());

	return app;
};

function mountRoutes(app) {
	app.get(
		"/v3/bundles/css",
		sanitiseModulesParameter,
		sanitiseMinifyParameter,
		require("./routes/v3/bundles/css"),
	);
	app.get(
		"/v3/bundles/hash",
		sanitiseModulesParameter,
		sanitiseExportParameter,
		sanitiseMinifyParameter,
		sanitiseAutoinitParameter,
		require("./routes/v3/bundles/hash"),
	);
	app.get(
		"/v3/bundles/js",
		sanitiseModulesParameter,
		sanitiseExportParameter,
		sanitiseMinifyParameter,
		sanitiseAutoinitParameter,
		require("./routes/v3/bundles/js"),
	);
	app.get(
		"/v3/files/:module([a-z0-9_][a-z0-9_.-]{0,}[a-z0-9_]@?[a-z0-9_.-]{0,})/:path([a-zA-Z0-9_.-/]+)",
		require("./routes/v3/bundles/files"),
	);

	app.get("/bundles/js", require("./routes/bundles/js"));
	app.get("/bundles/css", require("./routes/bundles/css"));
	app.get(["/files", "/files/*"], require("./routes/files"));
	app.get(["/modules", "/modules/*"], require("./routes/modules"));
	app.get(["/demos", "/demos/*"], require("./routes/demos"));
	// app.get("/", require("./routes/home"));
	// app.get(["/v1", "/v1/"], require("./routes/v1/home"));
	app.get("/v1/bundles/js", require("./routes/v1/bundles/js"));
	app.get("/v1/bundles/css", require("./routes/v1/bundles/css"));
	app.get(["/v1/files", "/v1/files/*"], require("./routes/v1/files"));
	app.get(["/v1/modules", "/v1/modules/*"], require("./routes/v1/modules"));
	app.get(["/v1/demos", "/v1/demos/*"], require("./routes/v1/demos"));
	// app.get(["/v2", "/v2/"], require("./routes/v2/home"));
	app.get("/v2/bundles/js", require("./routes/v2/bundles/js"));
	app.get("/v2/bundles/css", require("./routes/v2/bundles/css"));
	app.get(["/v2/files", "/v2/files/*"], require("./routes/v2/files"));
	app.get(["/v2/modules", "/v2/modules/*"], require("./routes/v2/modules"));
	app.get(["/v2/demos", "/v2/demos/*"], require("./routes/v2/demos"));
}
