"use strict";

const request = require("supertest");
const process = require("process");
const tap = require("tap");

const HOST = process.env.HOST;

tap.test("responds with 400 because no modules were specified", async t => {
  const response = await request(HOST).get("/v3/bundles/js");
  t.strictSame(response.statusCode, 400);
});

tap.test("responds with 200 and o-date javascript", async t => {
  const response = await request(HOST).get(
    "/v3/bundles/js?modules=@financial-times/o-date@*",
  );
  t.strictSame(response.statusCode, 200);
});
