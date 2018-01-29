"use strict";

const service = require("../../lib/service");
const supertest = require("supertest");

const noop = () => {};
const mockLog = {
	info: noop,
	error: noop,
	warn: noop,
};

before(function() {
	return service({
		environment: "test",
		log: mockLog,
		port: 0,
	})
		.listen()
		.then(app => {
			this.agent = supertest.agent(app);
			this.app = app;
		});
});

after(function() {
	this.app.origami.options._health.checkObjects.forEach(check => check.stop());
	this.app.origami.server.close();
});
