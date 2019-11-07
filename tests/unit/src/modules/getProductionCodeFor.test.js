"use strict";

const tap = require("tap");
const mockery = require("mockery");
const sinon = require("sinon");

tap.test("getProductionCodeFor", t => {
  t.beforeEach((done, t) => {
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false,
    });
    t.context.execaStub = { command: sinon.stub() };
    mockery.registerMock("execa", t.context.execaStub);
    t.context.decompressStub = sinon.stub();
    mockery.registerMock("decompress", t.context.decompressStub);
    t.context.rimrafStub = sinon.stub();
    mockery.registerMock("rimraf", t.context.rimrafStub);
    t.context.tarStub = { c: sinon.stub() };
    mockery.registerMock("tar", t.context.tarStub);
    t.context.fsStub = {
      mkdtemp: sinon.stub().resolves("/temp-test-directory"),
      mkdir: sinon.stub().resolves(),
      readFile: sinon.stub().resolves(new ArrayBuffer()),
    };
    mockery.registerMock("fs", { promises: t.context.fsStub });
    t.context.getProductionCodeFor = require("../../../../src/modules/getProductionCodeFor");
    done();
  });

  t.afterEach(done => {
    mockery.disable();
    done();
  });

  t.test("it is a function", async t => {
    t.type(t.context.getProductionCodeFor, "function");
    t.end();
  });

  t.test(
    "downloads a tarball from npm with the name and version given",
    async t => {
      t.context.execaStub.command.resolves({
        stdout: new ArrayBuffer(),
      });
      t.context.decompressStub.resolves();
      t.context.rimrafStub.yields();
      await t.context.getProductionCodeFor("@financial-times/o-test", "1.2.3");
      t.true(
        t.context.execaStub.command.calledOnceWith(
          `npm pack @financial-times/o-test@'1.2.3'`,
          {
            shell: true,
          },
        ),
      );
      t.end();
    },
  );

  t.test("Removes img folder from only the o-grid tarball", async t => {
    t.context.execaStub.command.resolves({
      stdout: new ArrayBuffer(),
    });
    t.context.decompressStub.resolves();
    t.context.rimrafStub.yields();
    t.context.fsStub.mkdtemp.resolves("/temp-test-directory");
    await t.context.getProductionCodeFor("@financial-times/o-test", "1.2.3");
    t.false(t.context.rimrafStub.calledWith(`/temp-test-directory/img`));
    await t.context.getProductionCodeFor("@financial-times/o-grid", "1.2.3");
    t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/img`));
    t.end();
  });
  t.end();
});
