"use strict";

const { DataMapper } = require("@aws/dynamodb-data-mapper");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const process = require("process");
const useLocal =
  Boolean(process.env.LOCALSTACK_HOSTNAME) ||
  process.env.NODE_ENV !== "production";
let client;

if (useLocal) {
  const localhost = process.env.LOCALSTACK_HOSTNAME || "localhost";
  client = new DynamoDB({
    region: process.env.AWS_REGION,
    endpoint: `http://${localhost}:4569`,
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
