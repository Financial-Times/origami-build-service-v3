"use strict";

const createError = require("http-errors");
const process = require("process");
const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");

const updateOrigamiComponentList = require("../src/update_origami_component_list");

module.exports.handler = RavenLambdaWrapper.handler(Raven, async () => {
  try {
    updateOrigamiComponentList({
      origamiRepoDataApiKey: process.env.ORIGAMI_REPO_DATA_KEY_ID,
      origamiRepoDataApiSecret: process.env.ORIGAMI_REPO_DATA_SECRET_KEY
    }).catch(e => {
      throw e;
    });
    return {
      body: JSON.stringify(
        {
          message: "Updating the Origami Component database"
        },
        null,
        2
      ),
      statusCode: 200
    };
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
      "Could not update the Origami Component list"
    );
  }
});
