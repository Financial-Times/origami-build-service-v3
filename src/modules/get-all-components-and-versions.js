"use strict";

const polyfill = require("array.prototype.flatmap");
polyfill.shim();
const RepoDataClient = require("@financial-times/origami-repo-data-client");
const log = require("./log");
const execa = require("execa");

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
  origamiRepoDataApiSecret,
}) {
  const repoData = new RepoDataClient({
    apiKey: origamiRepoDataApiKey,
    apiSecret: origamiRepoDataApiSecret,
  });
  const listRepos = retryIfServerError(repoData.listRepos, repoData);

  const result = [];
  log("Getting list of components");
  const components = new Set(
    (
      await listRepos({
        type: ["module", "imageset"],
        status: ["active", "maintained", "experimental", "deprecated"],
      })
    )
      .filter(({ name }) => {
        if (
          name.startsWith("o-comment") ||
          name === "o-gallery" ||
          name === "o-test-component" ||
          name === "origami-brand-images" ||
          name === "headshot-images" ||
          name === "logo-images" ||
          name === "origami-flag-images" ||
          name === "origami-specialist-title-logos" ||
          name === "podcast-logos" ||
          name === "social-images" ||
          name.startsWith("n")
        ) {
          return false;
        } else {
          return true;
        }
      })
      .map(c => "@financial-times/" + c.name),
  );

  log(`Got list of components. Found ${components.size} component/s`);
  const componentsAndVersions = new Map();
  for (const component of components) {
    log(`Getting versions for ${component}`);
    try {
      const command = `npm info ${component}@'*' version --json`;
      const { stdout } = await execa.command(command, {
        shell: true,
      });

      const versions = JSON.parse(stdout || "[]");
      componentsAndVersions.set(
        component,
        new Set(Array.isArray(versions) ? versions : [versions]),
      );
      log(`Found ${versions.length} versions for ${component}`);
    } catch (e) {
      try {
        const code = JSON.parse(e.stdout).error.code;
        if (code === "E404") {
          log(`${component} is not on npm`);
          components.delete(component);
        } else {
          log("error:", JSON.parse(e.stdout));
          throw e;
        }
      } catch (er) {
        log({ error: e, component });
        throw e;
      }
    }
  }

  let count = 1;
  for (const component of components) {
    try {
      const componentWithVersionRange =
        component.lastIndexOf("@") > 0 ? component : component + "@'*'";
      const command = `npm info ${componentWithVersionRange} dependencies --json`;

      const { stdout } = await execa.command(command, {
        shell: true,
      });
      let dependencies = JSON.parse(stdout || "[]");
      dependencies = Array.isArray(dependencies)
        ? dependencies
        : [dependencies];

      for (const dependency of dependencies) {
        for (const [name, version] of Object.entries(dependency)) {
          if (componentsAndVersions.has(name)) {
            const versions = componentsAndVersions.get(name);
            versions.add(version);
            componentsAndVersions.set(name, versions);
          } else {
            componentsAndVersions.set(name, new Set([version]));
          }
          components.add(`${name}@'${version}'`);
        }
      }
      log("count", count);
      count = count + 1;
      log("component count", components.size);
    } catch (e) {
      log({ error: e, component });
      throw e;
    }
  }

  for (const component of componentsAndVersions.keys()) {
    for (const version of componentsAndVersions.get(component)) {
      const command = `npm info ${component}@'${version}' version name dependencies --json`;

      const { stdout } = await execa.command(command, {
        shell: true,
      });
      let info = JSON.parse(stdout || "[]");
      info = Array.isArray(info) ? info : [info];
      log(`${component}@${version}`);
      info.sort((a, b) => b.version.localeCompare(a.version));

      result.push({
        name: component,
        version: info[0].version,
        dependencies: JSON.stringify(info[0].dependencies || {}),
      });
    }
  }

  return result;
};
