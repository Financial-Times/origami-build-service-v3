import { DataMapper } from "@aws/dynamodb-data-mapper";
import DynamoDB from "aws-sdk/clients/dynamodb";
import * as process from "process";
const useLocal =
  process.env.STAGE === "local" || process.env.NODE_ENV !== "production";
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

export const mapper = new DataMapper({
  client,
});
