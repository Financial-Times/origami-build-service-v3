"use strict";

const createError = require("http-errors");
const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");
const { jsBundle } = require("../src/create-javascript-bundle");
const process = require("process");

process.on("unhandledRejection", function(err) {
  console.error(err);
  Raven.captureException(err, function(sendErr) {
    // This callback fires once the report has been sent to Sentry
    if (sendErr) {
      console.error("Failed to send captured exception to Sentry");
    } else {
      console.log("Captured exception and sent to Sentry successfully");
    }
  });
  process.exit(1);
});

const jsHandler = RavenLambdaWrapper.handler(Raven, async event => {
  try {
    // This await is required to make the Promise rejection from
    // jsBundle be turned into a thrown error that we can catch.
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
        `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: " + err.message,
        )})`,
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
        `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: Could not create bundle",
        )})`,
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
