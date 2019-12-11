/* eslint-env mocha */
"use strict";

const request = require("supertest");
const process = require("process");
const proclaim = require("proclaim");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { Script } = require("vm");

const doesNotThrowInBrowserEnvironment = js => {
  const dom = new JSDOM(``, { runScripts: "outside-only" });
  const script = new Script(js);

  proclaim.doesNotThrow(() => {
    try {
      dom.runVMScript(script);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, `Expected to be valid browser-based JavaScript but it was not.`);

  return dom.window;
};

const doesThrowInBrowserEnvironment = (js, message) => {
  const dom = new JSDOM(``, { runScripts: "outside-only" });
  const script = new Script(js);
  proclaim.throws(() => {
    dom.runVMScript(script);
  }, message);
};

const HOST = process.env.HOST;

describe("/v3/bundles/js", function() {
  context("missing all parameters", function() {
    it("GET /v3/bundles/js", async function() {
      const response = await request(HOST).get("/v3/bundles/js");
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter is required.",
      );
    });
  });

  context("invalid modules parameter", function() {
    it("GET /v3/bundles/js?modules", async function() {
      const response = await request(HOST).get("/v3/bundles/js?modules");
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter is required.",
      );
    });

    it("GET /v3/bundles/js?modules=,,", async function() {
      const response = await request(HOST).get("/v3/bundles/js?modules=,,");
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter can not contain empty module names.",
      );
    });

    it("GET /v3/bundles/js?modules=!1", async function() {
      const response = await request(HOST).get(`/v3/bundles/js?modules=!1`);
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter contains module names which are not valid: !1.",
      );
    });
  });

  context.skip("missing source parameter", function() {
    it("returns an error", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@*",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: Missing source query parameter, the value should be a valid biz-ops systemcode.",
      );
    });
  });

  context("basic request", function() {
    it("GET /v3/bundles/js?modules=component-with-no-dependencies@1.0.0&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@1.0.0&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      const window = doesNotThrowInBrowserEnvironment(response.text);
      proclaim.include(window.Origami, "component-with-no-dependencies");
    });
  });

  context("requesting the same module multiple times", function() {
    it("GET /v3/bundles/js?modules=component-with-no-dependencies@1.0.0,component-with-no-dependencies@1.0.1", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@*,component-with-no-dependencies@*",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter contains duplicate module names.",
      );
    });

    it("GET /v3/bundles/js?modules=component-with-no-dependencies@1.0.1,component-with-no-dependencies@1.0.0%20-%201.0.19", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@1.0.1,component-with-no-dependencies@1.0.0%20-%201.0.19",
      );

      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter contains duplicate module names.",
      );
    });
  });

  context("requesting two different modules", async function() {
    it("GET /v3/bundles/js?modules=component-with-one-dependency@1.0.0,component-with-no-dependencies@1.0.0&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-one-dependency@1.0.0,component-with-no-dependencies@1.0.0&source=test",
      );

      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      const window = doesNotThrowInBrowserEnvironment(response.text);
      proclaim.include(window.Origami, "component-with-no-dependencies");
      proclaim.include(window.Origami, "component-with-one-dependency");
    });
  });

  context("invalid module name", function() {
    it("GET /v3/bundles/js?modules=o-autoinit_%25-test&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=o-autoinit_%25-test&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The modules query parameter contains module names which are not valid: o-autoinit_%-test.",
      );
    });
  });

  context("invalid version", function() {
    it("GET /v3/bundles/js?modules=component-with-no-dependencies@!1&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@!1&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The version !1 in component-with-no-dependencies@!1 is not a valid version.\nPlease refer to TODO (build service documentation) for what is a valid version.",
      );
    });
  });

  context("missing version range in request", function() {
    it("GET /v3/bundles/js?modules=component-with-no-dependencies&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.get("cache-control"),
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.get("content-type"),
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: The bundle request contains component-with-no-dependencies with no version range, a version range is required.\nPlease refer to TODO (build service documentation) for what is a valid version.",
      );
    });
  });

  context("module which does not exist", function() {
    it("GET /v3/bundles/js?modules=o-jake-does-not-exist@1&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=o-jake-does-not-exist@1&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: Because o-jake-does-not-exist doesn't exist (could not find package o-jake-does-not-exist) and your bundle depends on o-jake-does-not-exist, version solving failed.\n",
      );
    });
  });

  context("module which has invalid dependencies property", function() {
    it("GET /v3/bundles/js?modules=component-with-invalid-dependencies-property@1&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-invalid-dependencies-property@1&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      doesThrowInBrowserEnvironment(
        response.text,
        'Origami Build Service returned an error: component-with-invalid-dependencies-property@1.0.0: The manifest\'s "dependencies" field, must be a JSON Object but it was a string. The manifest is "{\n    "name": "component-with-invalid-dependencies-property",\n    "version": "1.0.0",\n    "dependencies": "invalid"\n}".',
      );
    });
  });

  context("module which has directly depended on itself", function() {
    it("GET /v3/bundles/js?modules=component-depends-directly-on-itself@1.0.0&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-depends-directly-on-itself@1.0.0&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      doesThrowInBrowserEnvironment(
        response.text,
        'Origami Build Service returned an error: component-depends-directly-on-itself@1.0.0: The manifest\'s "dependencies" field has an entry for itself. A manifest may not directly depend on itself. The manifest is "{\n    "name": "component-depends-directly-on-itself",\n    "version": "1.0.0",\n    "dependencies": {\n        "component-depends-directly-on-itself": "*"\n    }\n}".',
      );
    });
  });

  context("module which has invalid version for a dependency", function() {
    context("version is not a string", function() {
      it("GET /v3/bundles/js?modules=component-with-invalid-dependency-version@1.0.0&source=test", async function() {
        const response = await request(HOST).get(
          "/v3/bundles/js?modules=component-with-invalid-dependency-version@1.0.0&source=test",
        );
        proclaim.deepEqual(response.statusCode, 200);
        doesThrowInBrowserEnvironment(
          response.text,
          'Origami Build Service returned an error: component-with-invalid-dependency-version@1.0.0: The manifest\'s "dependencies" field has an entry for "component-with-no-dependencies" which is not a string. Dependencies can only be defined with SemVer strings. The manifest is "{\n    "name": "component-with-invalid-dependency-version",\n    "version": "1.0.0",\n    "dependencies": {\n        "component-with-no-dependencies": true\n    }\n}".',
        );
      });
    });

    context("version is an empty string", function() {
      it("GET /v3/bundles/js?modules=component-with-dependency-version-as-empty-string@1.0.0&source=test", async function() {
        const response = await request(HOST).get(
          "/v3/bundles/js?modules=component-with-dependency-version-as-empty-string@1.0.0&source=test",
        );
        proclaim.deepEqual(response.statusCode, 200);
        doesThrowInBrowserEnvironment(
          response.text,
          'Origami Build Service returned an error: component-with-dependency-version-as-empty-string@1.0.0: The manifest\'s "dependencies" field has an entry for "component-with-no-dependencies" which is an empty string. Dependencies can only be defined with SemVer strings. The manifest is "{\n    "name": "component-with-dependency-version-as-empty-string",\n    "version": "1.0.0",\n    "dependencies": {\n        "component-with-no-dependencies": ""\n    }\n}".',
        );
      });
    });

    context("version is a non-semver string", function() {
      it("GET /v3/bundles/js?modules=component-with-dependency-version-as-non-semver-string@1.0.0&source=test", async function() {
        const response = await request(HOST).get(
          "/v3/bundles/js?modules=component-with-dependency-version-as-non-semver-string@1.0.0&source=test",
        );
        proclaim.deepEqual(response.statusCode, 200);
        doesThrowInBrowserEnvironment(
          response.text,
          'Origami Build Service returned an error: component-with-dependency-version-as-non-semver-string@1.0.0: The manifest\'s "dependencies" field has an entry for "component-with-no-dependencies" which is an invalid SemVer string. The manifest is "{\n    "name": "component-with-dependency-version-as-non-semver-string",\n    "version": "1.0.0",\n    "dependencies": {\n        "component-with-no-dependencies": "^_^"\n    }\n}". Expected version number after "^" in "^_^", got "_^".',
        );
      });
    });
  });

  context("module which has dependency that doesn't exist", function() {
    it("GET /v3/bundles/js?modules=component-with-nonexistant-dependency@1.0.0&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-nonexistant-dependency@1.0.0&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: Because every version of component-with-nonexistant-dependency depends on @financial-times/o-no-i-dont-exist and @financial-times/o-no-i-dont-exist doesn't exist (could not find package @financial-times/o-no-i-dont-exist), component-with-nonexistant-dependency is forbidden.\nSo, because your bundle depends on component-with-nonexistant-dependency, version solving failed.\n",
      );
    });
  });

  context(
    "module which has dependency whose version doesn't exist",
    function() {
      it("GET /v3/bundles/js?modules=component-with-dependency-who-version-does-not-exist@1.0.0&source=test", async function() {
        const response = await request(HOST).get(
          "/v3/bundles/js?modules=component-with-dependency-who-version-does-not-exist@1.0.0&source=test",
        );
        proclaim.deepEqual(response.statusCode, 200);
        doesThrowInBrowserEnvironment(
          response.text,
          "Origami Build Service returned an error: Because every version of component-with-dependency-who-version-does-not-exist depends on component-with-no-dependencies and no versions of component-with-no-dependencies match 0.0.1, component-with-dependency-who-version-does-not-exist is forbidden.\nSo, because your bundle depends on component-with-dependency-who-version-does-not-exist, version solving failed.\n",
        );
      });
    },
  );

  context("version which does not exist", function() {
    it("GET /v3/bundles/js?modules=component-with-no-dependencies@1111111&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@1111111&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      doesThrowInBrowserEnvironment(
        response.text,
        "Origami Build Service returned an error: Because no versions of component-with-no-dependencies match 1111111.0.0 and your bundle depends on component-with-no-dependencies, version solving failed.\n",
      );
    });
  });

  context("attaches modules to the Origami global object", function() {
    it("GET /v3/bundles/js?modules=component-with-no-dependencies@1.0.0&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=component-with-no-dependencies@1.0.0&source=test",
      );

      const window = doesNotThrowInBrowserEnvironment(response.text);
      proclaim.include(window.Origami, "component-with-no-dependencies");
    });
  });
});
