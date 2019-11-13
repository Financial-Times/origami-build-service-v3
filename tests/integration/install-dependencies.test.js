/* eslint-env mocha */
"use strict";

const installDependencies = require("../../src/modules/install-dependencies");
const path = require("path");
const os = require("os");
const cacheDirectory = path.join(os.tmpdir(), "pubgrub-test-cache");
const util = require("util");
const rimraf = require("rimraf");
const rmrf = util.promisify(rimraf);
const { ArgumentError } = require("../../src/modules/errors");
const proclaim = require("proclaim");
const fs = require("fs").promises;
const testDirectory = path.join(os.tmpdir(), "pubgrub-test-directory");
const packageJsonPath = path.join(testDirectory, "package.json");
const process = require("process");

process.on("unhandledRejection", function(err) {
  console.error(err);
  process.exit(1);
});

describe("install-dependencies", function() {
  beforeEach(async function() {
    await fs.mkdir(testDirectory, { recursive: true });
    await fs.mkdir(cacheDirectory, { recursive: true });
  });

  afterEach(async function() {
    await rmrf(cacheDirectory);
    await rmrf(testDirectory);
  });

  it("throws if location is not an absolute path", async function() {
    try {
      await installDependencies(".");
      proclaim.fail(
        `installDependencies('.')`,
        undefined,
        "Expected function to throw but it did not throw.",
      );
    } catch (e) {
      proclaim.isInstanceOf(e, ArgumentError);
      proclaim.equal(
        e.message,
        'rootDir needs to be an absolute path. rootDir is ".".',
      );
    }
  });

  it("throws if location is does not have a package.json file", async function() {
    try {
      await installDependencies(testDirectory);
      proclaim.fail(
        `installDependencies("${testDirectory})`,
        undefined,
        "Expected function to throw but it did not throw.",
      );
    } catch (e) {
      proclaim.equal(
        e.message,
        `Could not find a file named "package.json" in "${testDirectory}".`,
      );
    }
  });

  it("throws if package.json file is not JSON", async function() {
    try {
      await fs.writeFile(path.join(testDirectory, "package.json"), "");
      await installDependencies(testDirectory);
      proclaim.fail(
        `installDependencies("${testDirectory}")`,
        undefined,
        "Expected function to throw but it did not throw.",
      );
    } catch (e) {
      proclaim.equal(
        e.message,
        `The manifest must be a JSON object. The manifest was "".`,
      );
    }
  });

  it("throws if package.json file is not a JSON object", async function() {
    try {
      await fs.writeFile(path.join(testDirectory, "package.json"), "[]");
      await installDependencies(testDirectory);
      proclaim.fail(
        `installDependencies("${testDirectory}")`,
        undefined,
        "Expected function to throw but it did not throw.",
      );
    } catch (e) {
      proclaim.equal(
        e.message,
        `The manifest must be a JSON object. The manifest was "[]".`,
      );
    }
  });

  context("package.json file is a JSON Object", function() {
    it("throws if package.json file is an empty JSON object", async function() {
      try {
        await fs.writeFile(path.join(testDirectory, "package.json"), "{}");
        await installDependencies(testDirectory);
        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          `The manifest is missing the "name" field, which should be a string. The manifest was "{}".`,
        );
      }
    });

    it("works if package.json file has a name and no dependencies", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
      });
      await fs.writeFile(packageJsonPath, packageContents);
      await installDependencies(testDirectory);
      const entries = await fs.readdir(testDirectory);
      proclaim.deepStrictEqual(entries, ["package.json"]);
      const packageJsonContents = await fs.readFile(packageJsonPath, "utf-8");
      proclaim.deepStrictEqual(packageJsonContents, packageContents);
    });

    it("throws if the dependencies field is not a JSON Object", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: true,
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          `The manifest's "dependencies" field, must be a JSON Object. The manifest was "{"name":"install-dependencies-test","dependencies":true}".`,
        );
      }
    });

    it("works if dependencies field is an empty JSON Object", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: {},
      });
      await fs.writeFile(packageJsonPath, packageContents);
      await installDependencies(testDirectory);
      const entries = await fs.readdir(testDirectory);
      proclaim.deepStrictEqual(entries, ["package.json"]);
      const packageJsonContents = await fs.readFile(packageJsonPath, "utf-8");
      proclaim.deepStrictEqual(packageJsonContents, packageContents);
    });

    it("throws if the package directly depends on itself", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: { "install-dependencies-test": "*" },
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          `The manifest's "dependencies" field has an entry for itself. A manifest may not directly depend on itself. The manifest was "{"name":"install-dependencies-test","dependencies":{"install-dependencies-test":"*"}}".`,
        );
      }
    });

    it("throws if the dependencies field has a version which is not a string", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: { lodash: true },
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          `The manifest's "dependencies" field has an entry for "lodash" which is not a string. Dependencies can only be defined with SemVer strings. The manifest was "{"name":"install-dependencies-test","dependencies":{"lodash":true}}".`,
        );
      }
    });

    it("throws if the dependencies field has a version which is an empty string", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: { lodash: "" },
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          `The manifest's "dependencies" field has an entry for "lodash" which is an empty string. Dependencies can only be defined with SemVer strings. The manifest was "{"name":"install-dependencies-test","dependencies":{"lodash":""}}".`,
        );
      }
    });

    it("throws if the dependencies field has a version which is not a SemVer string", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: { lodash: "*-*" },
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          `The manifest's "dependencies" field has an entry for "lodash" which is an invalid SemVer string. The manifest was "{"name":"install-dependencies-test","dependencies":{"lodash":"*-*"}}". Could not parse version "*-*". Unknown text at "*-*".`,
        );
      }
    });

    it("throws if the dependencies field has a dependency which does not exist", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: { jakedash: "*" },
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          "Because install-dependencies-test depends on jakedash@* which doesn't exist (could not find package jakedash), version solving failed.\n",
        );
      }
    });

    it("throws if the dependencies field has a dependency whose version does not exist", async function() {
      const packageContents = JSON.stringify({
        name: "install-dependencies-test",
        dependencies: { "@financial-times/o-buttons": "1111111" },
      });
      await fs.writeFile(packageJsonPath, packageContents);
      try {
        await installDependencies(testDirectory);

        proclaim.fail(
          `installDependencies("${testDirectory}")`,
          undefined,
          "Expected function to throw but it did not throw.",
        );
      } catch (e) {
        proclaim.equal(
          e.message,
          "Because install-dependencies-test depends on @financial-times/o-buttons@1111111.0.0 which doesn't match any versions, version solving failed.\n",
        );
      }
    });
  });
});
