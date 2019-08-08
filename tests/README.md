
Origami Build Service
=====================

Creates bundles of JavaScript and CSS from [Origami components](https://registry.origami.ft.com/components).

See [the production service][production-url] for API information.

[![Build status](https://img.shields.io/circleci/project/Financial-Times/origami-build-service-v3.svg)][ci]
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


Table Of Contents
-----------------

  * [Requirements](#requirements)
  * [Running Locally](#running-locally)
  * [Configuration](#configuration)
  * [Testing](#testing)
  * [Deployment](#deployment)
  * [Monitoring](#monitoring)
  * [License](#license)


Requirements
------------

Running Origami Build Service requires [Node.js] and [npm] and [Serverless Framework CLI](https://www.npmjs.com/package/serverless).


Running Locally
---------------

Before we can run the application, we'll need to install dependencies:

```sh
npm install
```

Run the application in development mode with

```sh
npm run dev
```

Now you can access the app over HTTP on port `3000`: [http://localhost:3000/](http://localhost:3000/)


Configuration
-------------

We configure Origami Build Service using environment variables. In development, configurations are set in a `.env` file. In production, these are set through [Vault](https://github.com/Financial-Times/vault).

### Required everywhere

  * `NODE_ENV`: The environment to run the application in. One of `production`, `development` (default), or `test` (for use in automated tests).

### Required in production

  * `SENTRY_DSN`: The Sentry URL to send error information to



Testing
-------

The tests are split into unit tests and integration tests. To run tests on your machine you'll need to install [Node.js] and run `npm install`. Then you can run the following commands:

```sh
npm test              # run all the tests
npm test:unit         # run the unit tests
npm test:integration  # run the integration tests
```

The code will also need to pass linting on CI, you can run the linter locally with:

```sh
npm run lint
```


Deployment
----------

The production ([EU][production-eu]/[US][production-us]) and [QA][qa] applications run on [AWS]. We deploy continuously to QA via [CircleCI][ci]. We deploy to production via [CircleCI][ci] by tagging a commit with a SemVer tag.


Monitoring
----------

  * [Grafana dashboard][grafana]: graph memory, load, and number of requests
  * [Sentry dashboard (Production)][sentry-production]: records application errors in the production app
  * [Sentry dashboard (QA)][sentry-qa]: records application errors in the QA app
  * [Splunk dashboard (Production)][splunk]: query application logs


License
-------

The Financial Times has published this software under the [MIT license][license].



[aws]: https://example.com/
[ci]: https://circleci.com/gh/Financial-Times/origami-build-service-v3
[grafana]: https://example.com
[production-eu]: https://example.com
[production-us]: https://example.com
[qa]: https://example.com
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[production-url]: https://example.com
[sentry-production]: https://example.com
[sentry-qa]: https://example.com
[splunk]: https://example.com