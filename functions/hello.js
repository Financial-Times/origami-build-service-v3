"use strict";

const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");
const { hello } = require("../src/hello");

exports.hello = RavenLambdaWrapper.handler(Raven, async () => {
  return hello();
});
