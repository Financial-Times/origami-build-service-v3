"use strict";

const createError = require("http-errors");
const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");
const { jsBundle } = require("../src/jsBundle");

const jsHandler = RavenLambdaWrapper.handler(Raven, async event => {
  try {
    return jsBundle(event.queryStringParameters);
  } catch (err) {
    console.error(err);

    Raven.captureException(err, function(sendErr) {
      // This callback fires once the report has been sent to Sentry
      if (sendErr) {
        console.error("Failed to send captured exception to Sentry");
      } else {
        console.log("Captured exception and sent to Sentry successfully");
      }
    });

    return createError.InternalServerError(
      "Could not update the Origami Component list",
    );
  }
});

module.exports = {
  handler: jsHandler,
};