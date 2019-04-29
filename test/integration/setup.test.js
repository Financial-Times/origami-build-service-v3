"use strict";

const service = require("../../lib/service");

const noop = () => {};
const mockLog = {
	info: noop,
	error: noop,
	warn: noop,
};

before(function() {
	const app = service({
		environment: "test",
		log: mockLog,
		port: 0,
	});

	this.app = app;
	app.listen();
});

after(function() {
	this.app.origami.options._health.checkObjects.forEach(check => check.stop());
	this.app.origami.server.close();
});
