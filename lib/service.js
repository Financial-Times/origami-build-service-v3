"use strict";

const origamiService = require("@financial-times/origami-service");
const healthChecks = require("./health-checks");
const sanitiseModulesParameter = require("./middleware/sanitise-modules-parameter");
const sanitiseMinifyParameter = require("./middleware/sanitise-minify-parameter");
const sanitiseRegistryParameter = require("./middleware/sanitise-registry-parameter");
const sanitiseUaParameter = require("./middleware/sanitise-ua-parameter");
const requireSourceParameter = require("./middleware/require-source-parameter");
const compression = require("compression");

module.exports = function service(options) {
	options._health = healthChecks(options);
	options.healthCheck = options._health.checks();
	options.goodToGoTest = options._health.gtg();
	options.about = require("../about.json");
	options.defaultLayout = "main";
	if (options.environment !== "production") {
		options.requestLogFormat = "dev";
	}

	const app = origamiService(options);
	app.use(compression({ level: 9 }));
	app.use(origamiService.middleware.getBasePath());
	mountRoutes(app);
	app.use(origamiService.middleware.notFound());
	app.use(origamiService.middleware.errorHandler());

	return app;
};

function mountRoutes(app) {
	app.get(
		"/v3/bundles/css",
		requireSourceParameter,
		sanitiseRegistryParameter,
		sanitiseMinifyParameter,
		sanitiseModulesParameter,
		require("./routes/v3/bundles/css"),
	);
	app.get(
		"/v3/bundles/js",
		requireSourceParameter,
		sanitiseRegistryParameter,
		sanitiseMinifyParameter,
		sanitiseModulesParameter,
		sanitiseUaParameter,
		require("./routes/v3/bundles/js"),
	);
	app.get(
		"/v3/files/:module(((?:@[a-z0-9_][a-z0-9_.-]{0,}[a-z0-9_]/)?[a-z0-9_][a-z0-9_.-]{0,}[a-z0-9_]@?[a-z0-9_.-]{0,}))/:path([a-zA-Z0-9_./-]+)",
		requireSourceParameter,
		sanitiseRegistryParameter,
		require("./routes/v3/bundles/files"),
	);
}
