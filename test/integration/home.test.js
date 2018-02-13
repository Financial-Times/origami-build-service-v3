"use strict";

const itRespondsWithStatus = require("./helpers/it-responds-with-status");
const itRespondsWithHeader = require("./helpers/it-responds-with-header");
const setupRequest = require("./helpers/setup-request");

describe.skip("GET /", function() {
	setupRequest("GET", "/");
	itRespondsWithStatus(302);
	itRespondsWithHeader("Location", "/v3/");
});
