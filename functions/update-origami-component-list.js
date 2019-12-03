"use strict";

// This is required for the @aws/dynamodb-data-mapper-annotations package to work.
import "reflect-metadata";

import * as createError from "http-errors";
import * as process from "process";
import Sentry from "@sentry/node";
import * as SentryLambdaWrapper from "serverless-sentry-lib";

import { updateOrigamiComponentList } from "../src/update-origami-component-list";

const handler = SentryLambdaWrapper.handler(Sentry, async () => {
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
    Sentry.captureException(err);

    return createError.InternalServerError(
      "Could not update the Origami Component list",
    );
  }
});

export { handler };
