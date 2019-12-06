"use strict";
const merge = require("lodash").merge;

module.exports = merge(require("./serverless"), {
  service: "obs",
  provider: {
    stage: "local",
  },
  custom: {
    localstack: {
      host: "http://localhost",
      autostart: true,
    },
  },
  plugins: ["serverless-localstack"],
});
