"use strict";

const request = require("supertest");
const process = require("process");
const tap = require("tap");

const HOST = process.env.HOST;
tap.test("responds with solved versions", async t => {
  const response = await request(HOST).get("/hello");
  t.strictSame(response.statusCode, 200);
});
