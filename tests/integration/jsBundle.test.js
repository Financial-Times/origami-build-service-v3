/* eslint-env mocha */
"use strict";

const request = require("supertest");
const process = require("process");
const proclaim = require("proclaim");
const isES5 = require("is-es5-syntax");
const isES6 = require("is-es6-syntax");
const isES7 = require("is-es7-syntax");
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
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter is required.",
      );
    });
  });

  context("invalid modules parameter", function() {
    it("GET /v3/bundles/js?modules", async function() {
      const response = await request(HOST).get("/v3/bundles/js?modules");
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter is required.",
      );
    });

    it("GET /v3/bundles/js?modules=,,", async function() {
      const response = await request(HOST).get("/v3/bundles/js?modules=,,");
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter can not be empty.",
      );
    });

    it("GET /v3/bundles/js?modules=!1", async function() {
      const response = await request(HOST).get(`/v3/bundles/js?modules=!1`);
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter contains module names which are not valid: !1.",
      );
    });
  });

  context.skip("missing source parameter", function() {
    it("returns an error", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-date@*",
      );
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "Missing source query parameter, the value should be a valid biz-ops systemcode.",
      );
    });
  });

  context("basic request", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-date@*&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-date@*&source=test",
      );
      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      const window = doesNotThrowInBrowserEnvironment(response.text);
      proclaim.include(window.Origami, "@financial-times/o-date");
    });
  });

  context("requesting the same module multiple times", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-date@*,@financial-times/o-date@*", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-date@*,@financial-times/o-date@*",
      );
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter contains duplicate module names.",
      );
    });

    it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.17%20-%201.0.19", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.17%20-%201.0.19",
      );

      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter contains duplicate module names.",
      );
    });

    it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.17,@financial-times/o-test-component@1.0.19", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-test-component@1.0.17,@financial-times/o-test-component@1.0.19",
      );
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter contains duplicate module names.",
      );
    });
  });

  context("requesting two different modules", async function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-autoinit@1.5,@financial-times/o-date@*&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-autoinit@1.5,@financial-times/o-date@*&source=test",
      );

      proclaim.deepEqual(response.statusCode, 200);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      const window = doesNotThrowInBrowserEnvironment(response.text);
      proclaim.include(window.Origami, "@financial-times/o-date");
      proclaim.include(window.Origami, "@financial-times/o-autoinit");
    });
  });

  context("invalid module name", function() {
    it("GET /v3/bundles/js?modules=o-autoinit_±-test&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=o-autoinit_±-test&source=test",
      );
      proclaim.deepEqual(response.statusCode, 400);
      proclaim.deepEqual(
        response.headers["cache-control"],
        "max-age=0, must-revalidate, no-cache, no-store",
      );
      proclaim.deepEqual(
        response.headers["content-type"],
        "application/javascript;charset=UTF-8",
      );
      // TODO: Is this a potential XSS?
      doesThrowInBrowserEnvironment(
        response.text,
        "The modules query parameter contains module names which are not valid: o-autoinit_±-test.",
      );
    });
  });

  context("module which does not exist", function() {
    it("GET /v3/bundles/js?modules=o-jake-does-not-exist&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=o-jake-does-not-exist&source=test",
      );
      proclaim.deepEqual(response.statusCode, 400);
      doesThrowInBrowserEnvironment(
        response.text,
        "Because o-bundle depends on o-jake-does-not-exist which doesn't exist (could not find package o-jake-does-not-exist), version solving failed.\n",
      );
    });
  });

  context("attaches modules to the Origami global object", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-date@*&source=test", async function() {
      const response = await request(HOST).get(
        "/v3/bundles/js?modules=@financial-times/o-date@*&source=test",
      );

      const window = doesNotThrowInBrowserEnvironment(response.text);
      proclaim.include(window.Origami, "@financial-times/o-date");
    });
  });

  context.skip(
    "compiles the JavaScript based upon the user-agent header",
    function() {
      it("compiles to ES5 for user-agents the service is not aware of", function() {
        return request(HOST)
          .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
          .set("User-Agent", "unknown_browser/1.2.3")
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("compiles to ES5 for Internet Explorer 11", function() {
        return request(HOST)
          .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
          .set("User-Agent", "ie/11")
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("compiles to ES5 for Internet Explorer 10", function() {
        return request(HOST)
          .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
          .set("User-Agent", "ie/10")
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("does not compile to ES5 or ES6 for Chrome 70", function() {
        // o-test-component 1.0.29 is written in ES7 syntax
        return request(HOST)
          .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
          .set("User-Agent", "chrome/70")
          .expect(response => {
            proclaim.isFalse(
              isES5(response.text),
              "expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
            );
            proclaim.isFalse(
              isES6(response.text),
              "expected JavaScript response to not be valid ECMAScript 6 syntax but it was.",
            );
            proclaim.isTrue(
              isES7(response.text),
              "expected JavaScript response to be valid ECMAScript 7 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("does not compile to ES5 for Chrome 70", function() {
        // o-test-component 1.0.32 is written in ES5 syntax
        return request(HOST)
          .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
          .set("User-Agent", "chrome/70")
          .expect(response => {
            proclaim.isFalse(
              isES5(response.text),
              "expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
            );
            proclaim.isTrue(
              isES6(response.text),
              "expected JavaScript response to be valid ECMAScript 6 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });
    },
  );

  context.skip(
    "compiles the JavaScript based upon the ua query parameter",
    function() {
      it("takes precedant over the user-agent header", function() {
        return request(HOST)
          .get(
            "/v3/bundles/js?modules=@financial-times/o-date@*&source=test&ua=unknown_browser/1.2.3",
          )
          .set("User-Agent", "chrome/70")
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("compiles to ES5 for user-agents the service is not aware of", function() {
        return request(HOST)
          .get(
            "/v3/bundles/js?modules=@financial-times/o-date@*&source=test&ua=unknown_browser/1.2.3",
          )
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("compiles to ES5 for Internet Explorer 11", function() {
        return request(HOST)
          .get(
            "/v3/bundles/js?modules=@financial-times/o-date@*&source=test&=ie/11",
          )
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("compiles to ES5 for Internet Explorer 10", function() {
        return request(HOST)
          .get(
            "/v3/bundles/js?modules=@financial-times/o-date@*&source=test&ua=ie/10",
          )
          .expect(response => {
            proclaim.isTrue(
              isES5(response.text),
              "expected JavaScript response to be valid ECMAScript 5 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("does not compile to ES5 or ES6 for Chrome 70", function() {
        // @financial-times/o-test-component 1.0.29-test is written in ES7 syntax
        return request(HOST)
          .get(
            "/v3/bundles/js?modules=@financial-times/o-date@*&source=test&ua=chrome/70",
          )
          .expect(response => {
            proclaim.isFalse(
              isES5(response.text),
              "expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
            );
            proclaim.isFalse(
              isES6(response.text),
              "expected JavaScript response to not be valid ECMAScript 6 syntax but it was.",
            );
            proclaim.isTrue(
              isES7(response.text),
              "expected JavaScript response to be valid ECMAScript 7 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });

      it("does not compile to ES5 for Chrome 70", function() {
        // @financial-times/o-test-component 1.0.32-test is written in ES5 syntax
        return request(HOST)
          .get(
            "/v3/bundles/js?modules=@financial-times/o-date@*&source=test&ua=chrome/70",
          )
          .expect(response => {
            proclaim.isFalse(
              isES5(response.text),
              "expected JavaScript response to not be valid ECMAScript 5 syntax but it was.",
            );
            proclaim.isTrue(
              isES6(response.text),
              "expected JavaScript response to be valid ECMAScript 6 syntax but it was not.",
            );
          })
          .expect(response => {
            const window = doesNotThrowInBrowserEnvironment(response.text);
            proclaim.include(window.Origami, "@financial-times/o-date");
          });
      });
    },
  );
});
