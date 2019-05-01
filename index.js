"use strict";

require("make-promises-safe"); // installs an 'unhandledRejection' handler

const dotenv = require("dotenv");
const service = require("./lib/service");
const throng = require("throng");

dotenv.config();

const options = {
	log: console,
	name: "Origami Build Service",
	workers: process.env.WEB_CONCURRENCY || 1,
	environment: process.env.NODE_ENV,
	githubUsername: process.env.GITHUB_USERNAME,
	githubPassword: process.env.GITHUB_PASSWORD,
};

if (options.environment === "production") {
	throng({
		workers: options.workers,
		start: async () => {
			const app = service(options);
			app.listen().catch(() => {
				process.exit(1);
			});
		},
	});
} else {
	const app = service(options);
	app.listen().catch(() => {
		process.exit(1);
	});
}
