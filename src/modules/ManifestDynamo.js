"use strict";

// This is required for the @aws/dynamodb-data-mapper-annotations package to work.
require("reflect-metadata");

const {
  attribute,
  hashKey,
  rangeKey,
  table
} = require("@aws/dynamodb-data-mapper-annotations");

/**
 * Applies a set of decorators to a property of a target object.
 * @param {Array<function(T, string=): T | void>} decorators An array of decorator functions.
 * @param {T} target The target object.
 * @param {string} [propertyKey] The property key to decorate.
 * @template T
 * @remarks Decorators are applied in reverse order.
 * @example
 *
 *     class Example {
 *         static staticMethod() { }
 *         method() { }
 *     }
 *
 *     // property (on constructor)
 *     decorate(decoratorsArray, Example, "staticProperty");
 *
 *     // method (on constructor)
 *     Object.defineProperty(Example, "staticMethod",
 *         decorate(decoratorsArray, Example, "staticMethod"));
 *
 *     // method (on prototype)
 *     Object.defineProperty(Example.prototype, "method",
 *         decorate(decoratorsArray, Example.prototype, "method"));
 *
 */
function decorateMethod(decorators, target, propertyKey) {
  if (propertyKey) {
    let propertyDescriptor = Object.getOwnPropertyDescriptor(
      target,
      propertyKey
    );
    for (let decorator of decorators.reverse()) {
      propertyDescriptor = decorator(target, propertyKey) || propertyDescriptor;
    }
    return propertyDescriptor;
  } else {
    for (let decorator of decorators.reverse()) {
      target = decorator(target) || target;
    }
    return target;
  }
}

/**
 * Applies a set of decorators to a target object.
 * @param {Array<function(T, string=): T | void>} decorators An array of decorator functions.
 * @param {T} target The target object.
 * @template T
 * @remarks Decorators are applied in reverse order.
 * @example
 *
 *     class Example {}
 *
 *     decorate(decoratorsArray, Example);
 *
 */
function decorateClass(decorators, target) {
  for (let decorator of decorators.reverse()) {
    target = decorator(target) || target;
  }
  return target;
}

let ManifestDynamo = decorateClass(
  [table("origami-build-service-components")],
  class {}
);

decorateMethod(
  [hashKey(), Reflect.metadata("design:type", String)],
  ManifestDynamo.prototype,
  "name"
);

decorateMethod(
  [rangeKey(), Reflect.metadata("design:type", String)],
  ManifestDynamo.prototype,
  "version"
);

decorateMethod(
  [attribute(), Reflect.metadata("design:type", String)],
  ManifestDynamo.prototype,
  "dependencies"
);

decorateMethod(
  [attribute(), Reflect.metadata("design:type", String)],
  ManifestDynamo.prototype,
  "devDependencies"
);

decorateMethod(
  [attribute(), Reflect.metadata("design:type", ArrayBuffer)],
  ManifestDynamo.prototype,
  "code"
);

ManifestDynamo = decorateClass(
  [table("origami-build-service-components")],
  ManifestDynamo
);

module.exports = { ManifestDynamo };
