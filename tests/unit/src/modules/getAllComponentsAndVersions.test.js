"use strict";

const tap = require("tap");
const mockery = require("mockery");
const sinon = require("sinon");

tap.test("getAllComponentsAndVersions", t => {
  t.beforeEach((done, t) => {
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    t.context.repoDataStub = {
      listRepos: sinon.stub(),
      listVersions: sinon.stub(),
      getManifest: sinon.stub()
    };
    let repoData = sinon.stub().returns(t.context.repoDataStub);
    mockery.registerMock("@financial-times/origami-repo-data-client", repoData);
    t.context.getAllComponentsAndVersions = require("../../../../src/modules/getAllComponentsAndVersions");
    done();
  });

  t.afterEach(done => {
    mockery.disable();
    done();
  });

  t.test("it is a function", async t => {
    t.type(t.context.getAllComponentsAndVersions, "function");
    t.end();
  });

  t.test("it returns a list of all components at all versions", async t => {
    t.context.repoDataStub.listRepos
      .withArgs({
        type: "module"
      })
      .resolves([
        {
          name: "component-1",
          id: 1
        },
        {
          name: "component-2",
          id: 2
        }
      ]);
    t.context.repoDataStub.listVersions
      .withArgs(1)
      .resolves([
        {
          version: "1.0.0",
          id: 3
        }
      ])
      .withArgs(2)
      .resolves([
        {
          version: "1.0.0",
          id: 4
        },
        {
          version: "2.0.0",
          id: 5
        }
      ]);
    t.context.repoDataStub.getManifest
      .withArgs(1, 3, "bower")
      .resolves({})
      .withArgs(2, 4, "bower")
      .resolves({})
      .withArgs(2, 5, "bower")
      .resolves({});
    t.strictSame(
      await t.context.getAllComponentsAndVersions({
        origamiRepoDataApiKey: "xxxx",
        origamiRepoDataApiSecret: "yyyy"
      }),
      [
        {
          name: "component-1",
          version: "1.0.0",
          dependencies: "{}",
          devDependencies: "{}"
        },
        {
          name: "component-2",
          version: "1.0.0",
          dependencies: "{}",
          devDependencies: "{}"
        },
        {
          name: "component-2",
          version: "2.0.0",
          dependencies: "{}",
          devDependencies: "{}"
        }
      ]
    );
    t.end();
  });

  t.test(
    "includes a versions dependencies and dev-dependencies if they exist",
    async t => {
      t.context.repoDataStub.listRepos
        .withArgs({
          type: "module"
        })
        .resolves([
          {
            name: "component-1",
            id: 1
          },
          {
            name: "component-2",
            id: 2
          }
        ]);
      t.context.repoDataStub.listVersions
        .withArgs(1)
        .resolves([
          {
            version: "1.0.0",
            id: 3
          }
        ])
        .withArgs(2)
        .resolves([
          {
            version: "1.0.0",
            id: 4
          },
          {
            version: "2.0.0",
            id: 5
          }
        ]);
      t.context.repoDataStub.getManifest
        .withArgs(1, 3, "bower")
        .resolves({
          dependencies: {
            carrot: "^1"
          }
        })
        .withArgs(2, 4, "bower")
        .resolves({
          devDependencies: {
            parsnip: "*"
          }
        })
        .withArgs(2, 5, "bower")
        .resolves({
          dependencies: {
            carrot: "^1"
          },
          devDependencies: {
            parsnip: "*"
          }
        });
      t.strictSame(
        await t.context.getAllComponentsAndVersions({
          origamiRepoDataApiKey: "xxxx",
          origamiRepoDataApiSecret: "yyyy"
        }),
        [
          {
            name: "component-1",
            version: "1.0.0",
            dependencies: '{"carrot":"^1"}',
            devDependencies: "{}"
          },
          {
            name: "component-2",
            version: "1.0.0",
            dependencies: "{}",
            devDependencies: '{"parsnip":"*"}'
          },
          {
            name: "component-2",
            version: "2.0.0",
            dependencies: '{"carrot":"^1"}',
            devDependencies: '{"parsnip":"*"}'
          }
        ]
      );
      t.end();
    }
  );

  t.test(
    "retries if Origami Repo Data times out or DNS resolution failed",
    async t => {
      t.context.repoDataStub.listRepos
        .withArgs({
          type: "module"
        })
        .onFirstCall()
        .rejects({ error: { code: "ETIMEDOUT" } })
        .onSecondCall()
        .rejects({ error: { code: "ENOTFOUND" } })
        .onThirdCall()
        .resolves([
          {
            name: "component-1",
            id: 1
          },
          {
            name: "component-2",
            id: 2
          }
        ]);
      t.context.repoDataStub.listVersions
        .withArgs(1)
        .resolves([
          {
            version: "1.0.0",
            id: 3
          }
        ])
        .withArgs(2)
        .resolves([
          {
            version: "1.0.0",
            id: 4
          },
          {
            version: "2.0.0",
            id: 5
          }
        ]);
      t.context.repoDataStub.getManifest
        .withArgs(1, 3, "bower")
        .resolves({
          dependencies: {
            carrot: "^1"
          }
        })
        .withArgs(2, 4, "bower")
        .resolves({
          devDependencies: {
            parsnip: "*"
          }
        })
        .withArgs(2, 5, "bower")
        .resolves({
          dependencies: {
            carrot: "^1"
          },
          devDependencies: {
            parsnip: "*"
          }
        });
      t.strictSame(
        await t.context.getAllComponentsAndVersions({
          origamiRepoDataApiKey: "xxxx",
          origamiRepoDataApiSecret: "yyyy"
        }),
        [
          {
            name: "component-1",
            version: "1.0.0",
            dependencies: '{"carrot":"^1"}',
            devDependencies: "{}"
          },
          {
            name: "component-2",
            version: "1.0.0",
            dependencies: "{}",
            devDependencies: '{"parsnip":"*"}'
          },
          {
            name: "component-2",
            version: "2.0.0",
            dependencies: '{"carrot":"^1"}',
            devDependencies: '{"parsnip":"*"}'
          }
        ]
      );
      t.strictSame(t.context.repoDataStub.listRepos.callCount, 3);
      t.end();
    }
  );

  t.test("throws error if had to retry 30 times", async t => {
    t.context.repoDataStub.listRepos
      .withArgs({
        type: "module"
      })
      .rejects({ error: { code: "ETIMEDOUT" } });
    t.rejects(
      t.context.getAllComponentsAndVersions({
        origamiRepoDataApiKey: "xxxx",
        origamiRepoDataApiSecret: "yyyy"
      })
    );
    t.end();
  });

  t.test(
    "throws error if origami repo data has an error which is not ETIMEDOUT or ENOTFOUND",
    async t => {
      t.context.repoDataStub.listRepos
        .withArgs({
          type: "module"
        })
        .rejects({ error: { code: "EOHNO" } });
      t.rejects(
        t.context.getAllComponentsAndVersions({
          origamiRepoDataApiKey: "xxxx",
          origamiRepoDataApiSecret: "yyyy"
        })
      );
      t.end();
    }
  );

  t.test("it does not include a component if it has no manifest", async t => {
    t.context.repoDataStub.listRepos
      .withArgs({
        type: "module"
      })
      .resolves([
        {
          name: "component-1",
          id: 1
        }
      ]);
    t.context.repoDataStub.listVersions.withArgs(1).resolves([
      {
        version: "1.0.0",
        id: 3
      }
    ]);
    t.context.repoDataStub.getManifest
      .withArgs(1, 3, "bower")
      .rejects({ status: 404 });
    t.strictSame(
      await t.context.getAllComponentsAndVersions({
        origamiRepoDataApiKey: "xxxx",
        origamiRepoDataApiSecret: "yyyy"
      }),
      []
    );
    t.end();
  });

  t.test(
    "rejects if Repo data getManifest throws an error which is not a 404",
    async t => {
      t.context.repoDataStub.listRepos
        .withArgs({
          type: "module"
        })
        .resolves([
          {
            name: "component-1",
            id: 1
          }
        ]);
      t.context.repoDataStub.listVersions.withArgs(1).resolves([
        {
          version: "1.0.0",
          id: 3
        }
      ]);
      t.context.repoDataStub.getManifest
        .withArgs(1, 3, "bower")
        .rejects({ status: 500 });
      t.rejects(
        t.context.getAllComponentsAndVersions({
          origamiRepoDataApiKey: "xxxx",
          origamiRepoDataApiSecret: "yyyy"
        })
      );
      t.end();
    }
  );
  t.end();
});
