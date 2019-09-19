"use strict";

const RepoDataClient = require("@financial-times/origami-repo-data-client");
const log = require("./log");

function retryIfServerError(fn, context) {
  const maxRetries = 30;
  let attempts = 0;
  return async function(...args) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fn.apply(context, args);
      } catch (e) {
        if (
          e.error &&
          e.error.code !== "ETIMEDOUT" &&
          e.error.code !== "ENOTFOUND"
        ) {
          log(`${e.error.code !== "ETIMEDOUT"}, ${e.error.code}`);
          throw e;
        } else {
          if (attempts >= maxRetries) {
            log(`Request failed, retried request ${attempts} times.`);
            throw e;
          }
          log("Request failed, retrying request.");
          attempts = attempts + 1;
        }
      }
    }
  };
}

module.exports = async function getAllComponentsAndVersions({
  origamiRepoDataApiKey,
  origamiRepoDataApiSecret
}) {
  const repoData = new RepoDataClient({
    apiKey: origamiRepoDataApiKey,
    apiSecret: origamiRepoDataApiSecret
  });
  const listRepos = retryIfServerError(repoData.listRepos, repoData);
  const listVersions = retryIfServerError(repoData.listVersions, repoData);
  const getManifest = retryIfServerError(repoData.getManifest, repoData);

  const result = [];
  log("Getting list of components");
  const components = await listRepos({
    type: "module"
  });
  log(`Got list of components. Found ${components.length} component/s`);
  for (const component of components) {
    log(`Getting list of versions for ${component.name}`);
    const versions = await listVersions(component.id);
    log(
      `Got list of versions for ${component.name}. Found ${versions.length} version/s`
    );
    for (const { id: versionId, version } of versions) {
      const componentVersion = {
        name: component.name,
        version: version
      };
      try {
        log(`Getting manifest for ${component.name}@${version}`);
        const bowerManifest = await getManifest(
          component.id,
          versionId,
          "bower"
        );
        log(`Got manifest for ${component.name}@${version}`);
        componentVersion.dependencies = JSON.stringify(
          bowerManifest.dependencies || {}
        );
        componentVersion.devDependencies = JSON.stringify(
          bowerManifest.devDependencies || {}
        );
        result.push(componentVersion);
      } catch (e) {
        log(`No manifest found for ${component.name}@${version}`);
        if (e.status !== 404) {
          throw e;
        }
      }
    }
  }
  return result;
};
