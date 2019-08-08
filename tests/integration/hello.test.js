"use strict";

const request = require("supertest");
const process = require("process");

const HOST = process.env.HOST;

test("It should response the GET method with a 200 HTTP status code", async () => {
  const response = await request(HOST).get("/hello");
  expect(response.statusCode).toBe(200);
});
