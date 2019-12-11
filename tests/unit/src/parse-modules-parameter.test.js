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

    proclaim.throws(() => {
      parseModulesParameter();
    }, "The modules query parameter is required.");
  });

  it("throws UserError if modules parameter is empty string", async () => {
    proclaim.throws(() => {
      parseModulesParameter("");
    }, UserError);

    proclaim.throws(() => {
      parseModulesParameter("");
    }, "The modules query parameter is required.");
  });

  it("throws UserError if modules parameter contains duplicates", async () => {
    proclaim.throws(() => {
      parseModulesParameter("o-test@1,o-test@1");
    }, UserError);

    proclaim.throws(() => {
      parseModulesParameter("o-test@1,o-test@1");
    }, "The modules query parameter contains duplicate module names.");
  });

  it("throws UserError if modules parameter contains empty module names", async () => {
    proclaim.throws(() => {
      parseModulesParameter("o-test@1,,");
    }, UserError);

    proclaim.throws(() => {
      parseModulesParameter("o-test@1,,");
    }, "The modules query parameter can not contain empty module names.");
  });
});
