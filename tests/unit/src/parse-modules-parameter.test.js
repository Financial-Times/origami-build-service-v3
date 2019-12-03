/* eslint-env mocha */
"use strict";

import proclaim from "proclaim";
import { UserError } from "../../../src/modules/errors";
import { parseModulesParameter } from "../../../src/parse-modules-parameter";

describe("parseModulesParameter", () => {
  it("it is a function", async () => {
    proclaim.isFunction(parseModulesParameter);
  });

  it("throws UserError if modules parameter is undefined", async () => {
    proclaim.throws(() => {
      parseModulesParameter();
    }, UserError);
  });
});
