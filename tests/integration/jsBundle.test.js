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
const fs = require("fs");
const fetchPolyfill = fs.readFileSync(require.resolve("whatwg-fetch"), "utf-8");

const doesNotThrowInBrowserEnvironment = js => {
  const window = new JSDOM(``, { runScripts: "outside-only" }).window;
  proclaim.doesNotThrow(
    () => {
      try {
        window.eval(fetchPolyfill);
        window.eval(js);
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    undefined,
    `Expected to be valid browser-based JavaScript but it was not.`,
  );

  return window;
};

const doesThrowInBrowserEnvironment = (js, message) => {
  const window = new JSDOM(``, { runScripts: "outside-only" }).window;
  proclaim.throws(
    () => {
      window.eval(fetchPolyfill);
      window.eval(js);
    },
    undefined,
    message,
  );
};

const HOST = process.env.HOST;

describe("/v3/bundles/js", function() {
  context("missing all parameters", function() {
    it("GET /v3/bundles/js", async function() {
      return request(HOST)
        .get("/v3/bundles/js")
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter is required",
          );
        });
    });
  });

  context("invalid modules parameter", function() {
    it("GET /v3/bundles/js?modules", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules")
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter can not be empty",
          );
        });
    });

    it("GET /v3/bundles/js?modules=,,", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules=,,")
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter can not be empty",
          );
        });
    });

    it("GET /v3/bundles/js?modules=1a-", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules=1a-")
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter contains module names which are not valid: 1a-",
          );
        });
    });
  });

  context("missing source parameter", function() {
    it("returns an error", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules=o-test-component")
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "Missing source query parameter, the value should be a valid biz-ops systemcode.",
          );
        });
    });
  });

  context("basic request", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-date@*&source=test", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
        .expect(200)
        .expect(
          "cache-control",
          "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
        )
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(response => {
          const window = doesNotThrowInBrowserEnvironment(response.text);
          proclaim.include(window.Origami, "@financial-times/o-date");
        });
    });
  });

  context("requesting the same module multiple times", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-date@*,@financial-times/o-date@*", function() {
      return request(HOST)
        .get(
          "/v3/bundles/js?modules=@financial-times/o-date@*,@financial-times/o-date@*",
        )
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter contains duplicate module names.",
          );
        });
    });

    it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.17%20-%201.0.19", function() {
      return request(HOST)
        .get(
          "/v3/bundles/js?modules=@financial-times/o-test-component@1.0.19,@financial-times/o-test-component@1.0.17%20-%201.0.19",
        )
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter contains duplicate module names.",
          );
        });
    });

    it("GET /v3/bundles/js?modules=@financial-times/o-test-component@1.0.17,@financial-times/o-test-component@1.0.19", function() {
      return request(HOST)
        .get(
          "/v3/bundles/js?modules=@financial-times/o-test-component@1.0.17,@financial-times/o-test-component@1.0.19",
        )
        .expect(400)
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(
          "cache-control",
          "max-age=0, must-revalidate, no-cache, no-store",
        )
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            "The modules query parameter contains duplicate module names.",
          );
        });
    });
  });

  context("requesting two different modules", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-autoinit@1.5,@financial-times/o-date@*&source=test", function() {
      return request(HOST)
        .get(
          "/v3/bundles/js?modules=@financial-times/o-autoinit@1.5,@financial-times/o-date@*&source=test",
        )
        .expect(200)
        .expect(
          "cache-control",
          "public, max-age=86400, stale-if-error=604800, stale-while-revalidate=300000",
        )
        .expect("Content-Type", "application/javascript;charset=UTF-8")
        .expect(response => {
          const window = doesNotThrowInBrowserEnvironment(response.text);
          proclaim.include(window.Origami, "@financial-times/o-date");
          proclaim.include(window.Origami, "@financial-times/o-autoinit");
        });
    });
  });

  context("invalid module name", function() {
    it("GET /v3/bundles/js?modules=o-autoinit_±-test&source=test", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules=o-autoinit_±-test&source=test")
        .expect(400)
        .expect(response => {
          doesThrowInBrowserEnvironment(
            response.text,
            'The modules query parameter contains module names which are not valid: "o-autoinit_±-test"',
          );
        });
    });
  });

  context("attaches modules to the Origami global object", function() {
    it("GET /v3/bundles/js?modules=@financial-times/o-date@*&source=test", function() {
      return request(HOST)
        .get("/v3/bundles/js?modules=@financial-times/o-date@*&source=test")
        .expect(response => {
          const window = doesNotThrowInBrowserEnvironment(response.text);
          proclaim.include(window.Origami, "@financial-times/o-date");
        });
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
