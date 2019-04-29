"use strict";

require("make-promises-safe"); // installs an 'unhandledRejection' handler

const memwatch = require("@airbnb/node-memwatch");
const start = new Date();
function msFromStart() {
	return new Date() - start;
}

// report to console postgc heap size
memwatch.on("stats", function(d) {
	console.log("postgc:", {
		milliseconds_since_application_stated: msFromStart(),
		heap_used_in_bytes: d.used_heap_size,
	});
});

memwatch.on("leak", function(d) {
	console.log("LEAK:", d);
});

// also report periodic heap size (every 10s)
setInterval(function() {
	console.log("naive:", {
		milliseconds_since_application_stated: msFromStart(),
		memory_usage: process.memoryUsage(),
	});
}, 5000);

const process = require("process");
global.Promise = require("bluebird");
if (process.env.NODE_ENV !== "production") {
	Promise.config({
		longStackTraces: true,
	});
}

const dotenv = require("dotenv");
const service = require("./lib/service");
const throng = require("throng");

dotenv.load();

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
