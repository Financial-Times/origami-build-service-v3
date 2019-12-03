"use strict";

// This is required for the @aws/dynamodb-data-mapper-annotations package to work.
require("reflect-metadata");

// eslint-disable-next-line no-global-assign
require = require("esm")(module);
module.exports = require("./bootstrap.js");
