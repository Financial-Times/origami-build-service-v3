"use strict";

const dotenv = require("dotenv");
const service = require("./lib/service");
const throng = require("throng");
const process = require("process");

dotenv.load();

const options = {
	log: console,
	name: "Origami Build Service",
	workers: process.env.WEB_CONCURRENCY || 1,
	environment: process.env.NODE_ENV,
	githubUsername: process.env.GITHUB_USERNAME,
	githubPassword: process.env.GITHUB_PASSWORD,
};

async function startService() {
	if (options.environment === "production") {
		throng({
			workers: options.workers,
			start: async () => {
				const app = await service(options);
				app.listen().catch(() => {
					process.exit(1);
				});
			},
		});
	} else {
		const app = await service(options);
		app
			.listen()
			.listen()
			.catch(() => {
				process.exit(1);
			});
	}
}

startService();
