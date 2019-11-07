"use strict";

const path = require("path");
const { writeFile } = require("fs").promises;
const lodash = require("lodash");

/**
 * @param {string} installationDirectory
 * @param {import("immutable").Map<string, string>} modules
 */
async function createEntryFile(installationDirectory, modules) {
  const entryFileLocation = path.join(installationDirectory, "/index.js");

  const entryFileContents = modules
    .keySeq()
    .map((name, index) => {
      const camelCasedName = lodash.camelCase(name);
      const importModule = `import * as ${camelCasedName} from "${name}";`;
      let addModuleToOrigamiGlobal = "";
      if (index === 0) {
        addModuleToOrigamiGlobal += `if (typeof Origami === 'undefined') {window.Origami = {};}\n`;
      }
      addModuleToOrigamiGlobal += `window.Origami["${name}"] = ${camelCasedName};`;

      return `${importModule}\n${addModuleToOrigamiGlobal}`;
    })
    .join("\n");

  await writeFile(entryFileLocation, entryFileContents);

  return entryFileLocation;
}

module.exports.createEntryFile = createEntryFile;
