"use strict";

let { DataMapper } = require("@aws/dynamodb-data-mapper");
let DynamoDB = require("aws-sdk/clients/dynamodb");
let process = require("process");

let client;

if (process.env.IS_OFFLINE) {
  client = new DynamoDB({
    region: "localhost",
    endpoint: "http://localhost:8000",
  });
} else {
  client = new DynamoDB({
    apiVersion: "2012-08-10",
    region: process.env.AWS_REGION,
  });
}

const mapper = new DataMapper({
  client,
});

module.exports.mapper = mapper;
