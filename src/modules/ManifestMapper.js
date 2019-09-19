"use strict";
var { DataMapper } = require("@aws/dynamodb-data-mapper");
var DynamoDB = require("aws-sdk/clients/dynamodb");
var process = require("process");
const mapper = new DataMapper({
  client: new DynamoDB({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION
  })
});

module.exports = { mapper };
