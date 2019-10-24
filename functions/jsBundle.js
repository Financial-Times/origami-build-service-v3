"use strict";

const createError = require("http-errors");
const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");
const { jsBundle } = require("../src/jsBundle");

const jsHandler = RavenLambdaWrapper.handler(Raven, async event => {
  try {
    return await jsBundle(event.queryStringParameters);
  } catch (err) {
    Raven.captureException(err, function(sendErr) {
      // This callback fires once the report has been sent to Sentry
      if (sendErr) {
        console.error("Failed to send captured exception to Sentry");
      } else {
        console.log("Captured exception and sent to Sentry successfully");
      }
    });

    if (err.code) {
      return createError(err.code, err.message);
    } else {
      return createError.InternalServerError(
        "Could not update the Origami Component list",
      );
    }
  }
});
module.exports = {
  handler: jsHandler,
};
