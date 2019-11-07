"use strict";

let { DataMapper } = require("@aws/dynamodb-data-mapper");
let DynamoDB = require("aws-sdk/clients/dynamodb");
let process = require("process");
const mapper = new DataMapper({
  client: new DynamoDB({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION,
  }),
});

module.exports.mapper = mapper;
