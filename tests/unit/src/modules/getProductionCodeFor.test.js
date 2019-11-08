/* eslint-env mocha */
"use strict";

const mockery = require("mockery");
const sinon = require("sinon");
const proclaim = require("proclaim");

describe("getProductionCodeFor", () => {
  let execaStub;
  let decompressStub;
  let rimrafStub;
  let tarStub;
  let fsStub;
  let getProductionCodeFor;

  beforeEach(() => {
    mockery.enable({
      useCleanCache: true,
      warnOnReplace: false,
      warnOnUnregistered: false,
    });
    execaStub = { command: sinon.stub() };
    mockery.registerMock("execa", execaStub);
    decompressStub = sinon.stub();
    mockery.registerMock("decompress", decompressStub);
    rimrafStub = sinon.stub();
    mockery.registerMock("rimraf", rimrafStub);
    tarStub = { c: sinon.stub() };
    mockery.registerMock("tar", tarStub);
    fsStub = {
      mkdtemp: sinon.stub().resolves("/temp-test-directory"),
      mkdir: sinon.stub().resolves(),
      readFile: sinon.stub().resolves(new ArrayBuffer()),
    };
    mockery.registerMock("fs", { promises: fsStub });
    getProductionCodeFor = require("../../../../src/modules/getProductionCodeFor");
  });

  afterEach(() => {
    mockery.disable();
  });

  it("it is a function", async () => {
    proclaim.isFunction(getProductionCodeFor);
  });

  it("downloads a tarball from npm with the name and version given", async () => {
    execaStub.command.resolves({
      stdout: new ArrayBuffer(),
    });
    decompressStub.resolves();
    rimrafStub.yields();
    await getProductionCodeFor("@financial-times/o-test", "1.2.3");
    proclaim.isTrue(
      execaStub.command.calledOnceWith(
        `npm pack @financial-times/o-test@'1.2.3'`,
        {
          shell: true,
        },
      ),
    );
  });
});
