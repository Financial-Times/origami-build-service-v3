"use strict";

// This is required for the @aws/dynamodb-data-mapper-annotations package to work.
import "reflect-metadata";

import * as createError from "http-errors";
import * as process from "process";
import * as Raven from "raven";
import * as RavenLambdaWrapper from "serverless-sentry-lib";

import { updateOrigamiComponentList } from "../src/update-origami-component-list";

const handler = RavenLambdaWrapper.handler(Raven, async () => {
  try {
    updateOrigamiComponentList({
      origamiRepoDataApiKey: process.env.ORIGAMI_REPO_DATA_KEY_ID,
      origamiRepoDataApiSecret: process.env.ORIGAMI_REPO_DATA_SECRET_KEY,
    }).catch(e => {
      throw e;
    });

    return {
      body: JSON.stringify(
        {
          message: "Updating the Origami Component database",
        },
        null,
        2,
      ),
      statusCode: 200,
    };
  } catch (err) {
    console.error(err);

    Raven.captureException(err, function(sendErr) {
      // This callback fires once the report has been sent to Sentry
      if (sendErr) {
        console.error("Failed to send captured error to Sentry");
      } else {
        console.log("Captured error and sent to Sentry successfully");
      }
    });

    return createError.InternalServerError(
      "Could not update the Origami Component list",
    );
  }
});

export { handler };
