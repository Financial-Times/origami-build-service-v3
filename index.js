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
};

if (options.environment === "production") {
	throng({
		workers: options.workers,
		start: () => {
			service(options)
				.listen()
				.catch(() => {
					process.exit(1);
				});
		},
	});
} else {
	service(options)
		.listen()
		.catch(() => {
			process.exit(1);
		});
}
