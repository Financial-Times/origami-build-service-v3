"use strict";

const createError = require("http-errors");
const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");
const { jsBundle } = require("../src/jsBundle");

const jsHandler = RavenLambdaWrapper.handler(Raven, async event => {
  try {
    return await jsBundle(event.queryStringParameters);
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

    if (err.code) {
      return createError(
        err.code,
        `throw new Error(${JSON.stringify(err.message)})`,
        {
          headers: {
            "content-type": "application/javascript;charset=UTF-8",
            "cache-control": "max-age=0, must-revalidate, no-cache, no-store",
          },
        },
      );
    } else {
      // TODO: output stacktrace and error message if not running in production
      return createError.InternalServerError(
        `throw new Error(${JSON.stringify("Could not create bundle")})`,
        {
          headers: {
            "content-type": "application/javascript;charset=UTF-8",
            "cache-control": "max-age=0, must-revalidate, no-cache, no-store",
          },
        },
      );
    }
  }
});

module.exports = {
  handler: jsHandler,
};
