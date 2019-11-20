"use strict";

let { DataMapper } = require("@aws/dynamodb-data-mapper");
let DynamoDB = require("aws-sdk/clients/dynamodb");
let process = require("process");
const useLocal = process.env.NODE_ENV !== "production";
let client;

if (useLocal) {
  client = new DynamoDB({
    region: process.env.AWS_REGION,
    endpoint: "http://localhost:4569",
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
