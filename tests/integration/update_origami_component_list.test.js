"use strict";

const request = require("supertest");
const process = require("process");
const tap = require("tap");

const HOST = process.env.HOST;
tap.test(
  "It should response the GET method with a 200 HTTP status code",
  async t => {
    const response = await request(HOST).get(
      "/v3/update_origami_component_list",
    );
    t.strictSame(response.statusCode, 200);
  },
);
