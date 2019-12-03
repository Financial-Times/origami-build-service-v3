"use strict";

// This is required for the @aws/dynamodb-data-mapper-annotations package to work.
import "reflect-metadata";

import Sentry from "@sentry/node";
import * as SentryLambdaWrapper from "serverless-sentry-lib";
import { jsBundle } from "../src/create-javascript-bundle";
import * as process from "process";

process.on("unhandledRejection", function(err) {
  console.error(JSON.stringify(err));
  Sentry.captureException(err);
  process.exit(1);
});

const jsHandler = SentryLambdaWrapper.handler(Sentry, async event => {
  try {
    // This await is required to make the Promise rejection from
    // jsBundle be turned into a thrown error that we can catch.
    return await jsBundle(event.queryStringParameters);
  } catch (err) {
    console.error(JSON.stringify(err));
    Sentry.captureException(err);

    if (Number.isInteger(err.code + 0)) {
      return {
        body: `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: " + err.message,
        )})`,
        statusCode: err.code + 0,
        headers: {
          "Content-Type": "application/javascript;charset=UTF-8",
          "Cache-Control": "max-age=0, must-revalidate, no-cache, no-store",
        },
      };
    } else {
      // TODO: output stacktrace and error message if not running in production
      return {
        body: `throw new Error(${JSON.stringify(
          "Origami Build Service returned an error: Could not create bundle",
        )})`,
        statusCode: 500,
        headers: {
          "content-type": "application/javascript;charset=UTF-8",
          "cache-control": "max-age=0, must-revalidate, no-cache, no-store",
        },
      };
    }
  }
});

export { jsHandler as handler };
