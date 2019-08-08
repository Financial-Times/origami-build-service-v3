"use strict";

const { hello } = require("../../../src/hello");

test("returns an object with a statusCode and a body", async () => {
  const result = await hello();
  expect(result).toHaveProperty("statusCode");
  expect(result).toHaveProperty("body");
});
