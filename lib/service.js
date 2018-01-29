"use strict";

const origamiService = require("@financial-times/origami-service");
const healthChecks = require("./health-checks");

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

	app.use(origamiService.middleware.getBasePath());
	app.use(origamiService.middleware.notFound());
	app.use(origamiService.middleware.errorHandler());

	return app;
};
