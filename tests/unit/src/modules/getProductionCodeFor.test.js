"use strict";

const tap = require("tap");
const mockery = require("mockery");
const sinon = require("sinon");

tap.test("getProductionCodeFor", t => {
  t.beforeEach((done, t) => {
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false
    });
    t.context.axiosStub = sinon.stub();
    mockery.registerMock("axios", t.context.axiosStub);
    t.context.decompressStub = sinon.stub();
    mockery.registerMock("decompress", t.context.decompressStub);
    t.context.rimrafStub = sinon.stub();
    mockery.registerMock("rimraf", t.context.rimrafStub);
    t.context.tarStub = { c: sinon.stub() };
    mockery.registerMock("tar", t.context.tarStub);
    t.context.fsStub = {
      mkdtemp: sinon.stub().yields(undefined, "/temp-test-directory"),
      readFile: sinon.stub().yields(undefined, new ArrayBuffer())
    };
    mockery.registerMock("fs", t.context.fsStub);
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
    "downloads a tarball from github with the name and version given, prepending a v to the version",
    async t => {
      t.context.axiosStub.resolves({
        data: new ArrayBuffer()
      });
      t.context.decompressStub.resolves();
      t.context.rimrafStub.yields();
      await t.context.getProductionCodeFor("o-test", "1.2.3");
      t.true(
        t.context.axiosStub.calledOnceWith({
          method: "get",
          url: `https://codeload.github.com/Financial-Times/o-test/legacy.tar.gz/v1.2.3`,
          responseType: "arraybuffer"
        })
      );
      t.end();
    }
  );

  t.test(
    "if tarball download failed, try again without prepending the v to the version",
    async t => {
      t.context.axiosStub
        .onFirstCall()
        .rejects()
        .onSecondCall()
        .resolves({
          data: new ArrayBuffer()
        });
      t.context.decompressStub.resolves();
      t.context.rimrafStub.yields();
      await t.context.getProductionCodeFor("o-test", "1.2.3");
      t.true(
        t.context.axiosStub.firstCall.calledWith({
          method: "get",
          url: `https://codeload.github.com/Financial-Times/o-test/legacy.tar.gz/v1.2.3`,
          responseType: "arraybuffer"
        })
      );
      t.true(
        t.context.axiosStub.secondCall.calledWith({
          method: "get",
          url: `https://codeload.github.com/Financial-Times/o-test/legacy.tar.gz/1.2.3`,
          responseType: "arraybuffer"
        })
      );
      t.end();
    }
  );

  t.test(
    "Removes folders docs, test, demos, resources, examples from all downloaded tarballs",
    async t => {
      t.context.axiosStub.resolves({
        data: new ArrayBuffer()
      });
      t.context.decompressStub.resolves();
      t.context.rimrafStub.yields();
      t.context.fsStub.mkdtemp.yields(undefined, "/temp-test-directory");
      await t.context.getProductionCodeFor("o-test", "1.2.3");
      t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/docs`));
      t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/test`));
      t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/demos`));
      t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/resources`));
      t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/examples`));
      t.end();
    }
  );

  t.test("Removes img folder from only the o-grid tarball", async t => {
    t.context.axiosStub.resolves({
      data: new ArrayBuffer()
    });
    t.context.decompressStub.resolves();
    t.context.rimrafStub.yields();
    t.context.fsStub.mkdtemp.yields(undefined, "/temp-test-directory");
    await t.context.getProductionCodeFor("o-test", "1.2.3");
    t.false(t.context.rimrafStub.calledWith(`/temp-test-directory/img`));
    await t.context.getProductionCodeFor("o-grid", "1.2.3");
    t.true(t.context.rimrafStub.calledWith(`/temp-test-directory/img`));
    t.end();
  });
  t.end();
});
