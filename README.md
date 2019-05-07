# Origami Build Service

Creates bundles of JavaScript and CSS from Origami (and Origami-compatible modules). See [the production service][production-url] for API information.

[![Build status](https://img.shields.io/circleci/project/Financial-Times/origami-build-service-v3.svg)][ci]
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]

## Table Of Contents

* [Requirements](#requirements)
* [Running Locally](#running-locally)
* [Configuration](#configuration)
* [Testing](#testing)
* [Deployment](#deployment)
* [Monitoring](#monitoring)
* [License](#license)

## Requirements

Running Origami Build Service requires [Node.js] 8.x and [npm].

## Running Locally

Before we can run the application, we'll need to install dependencies:

```sh
npm install
```

Run the application in development mode with

```sh
make run-dev
```

Now you can access the app over HTTP on port `8080`: [http://localhost:8080/](http://localhost:8080/)

## Configuration

We configure Origami Build Service using environment variables. In development, configurations are set in a `.env` file. In production, these are set through [Heroku config](https://devcenter.heroku.com/articles/config-vars#setting-up-config-vars-for-a-deployed-application). Further documentation on the available options can be found in the [Origami Service documentation][service-options].

### Required everywhere

* `NODE_ENV`: The environment to run the application in. One of `production`, `development`, or `test`. Defaults to `development`.
* `PORT`: The port to run the application on. Defaults to port `8080`.

### Required in Heroku

* `FASTLY_PURGE_API_KEY`: A Fastly API key which is used to purge URLs (when somebody POSTs to the `/purge` endpoint).
* `GRAPHITE_API_KEY`: The FT's internal Graphite API key.
* `PURGE_API_KEY`: The API key to require when somebody POSTs to the `/purge` endpoint.
* `REGION`: The region the application is running in. One of `QA`, `EU`, or `US`.
* `RELEASE_LOG_API_KEY`: The change request API key to use when creating and closing release logs.
* `RELEASE_LOG_ENVIRONMENT`: The Salesforce environment to include in release logs. One of `Test` or `Production`.
* `SENTRY_DSN`: The Sentry URL to send error information to.

### Required in Heroku (QA only)

* `WHITESOURCE_API_KEY`: The API key to use when testing dependencies with Whitesource

### Required locally

* `GRAFANA_API_KEY`: The API key to use when using Grafana push/pull

### Headers

The service can also be configured by sending HTTP headers, these would normally be set in your CDN config:

* `FT-Origami-Service-Base-Path`: The base path for the service, this gets prepended to all paths in the HTML and ensures that redirects work when the CDN rewrites URLs.

## Testing

The tests are split into unit tests and integration tests. To run tests on your machine you'll need to install [Node.js] and run `npm install`. Then you can run the following commands:

```sh
make test              # run all the tests
make test-unit         # run the unit tests
npm run test:integration  # run the integration tests
```

You can run the unit tests with coverage reporting, which expects 90% coverage or more:

```sh
make test-unit-coverage verify-coverage
```

The code will also need to pass linting on CI, you can run the linter locally with:

```sh
make verify
```

We run the tests and linter on CI, you can view [results on CircleCI][ci]. `make test` and `make lint` must pass before we merge a pull request.

## Deployment

The production ([EU][heroku-production-eu]/[US][heroku-production-us]) and [QA][heroku-qa] applications run on [Heroku]. We deploy continuously to QA via [CircleCI][ci], you should never need to deploy to QA manually. We use a [Heroku pipeline][heroku-pipeline] to promote QA deployments to production.

You can promote either through the Heroku interface, or by running the following command locally:

```sh
make promote
```

## Monitoring

* [Grafana dashboard][grafana]: graph memory, load, and number of requests
* [Pingdom check (Production EU)][pingdom-eu]: checks that the EU production app is responding
* [Pingdom check (Production US)][pingdom-us]: checks that the US production app is responding
* [Sentry dashboard (Production)][sentry-production]: records application errors in the production app
* [Sentry dashboard (QA)][sentry-qa]: records application errors in the QA app
* [Splunk dashboard (Production)][splunk]: query application logs

## License

The Financial Times has published this software under the [MIT license][license].

[ci]: https://circleci.com/gh/Financial-Times/origami-build-service-v3
[grafana]: http://grafana.ft.com/dashboard/db/origami-build-service-v3
[heroku-pipeline]: https://dashboard.heroku.com/pipelines/
[heroku-production-eu]: https://dashboard.heroku.com/apps/origami-build-service-v3-eu
[heroku-production-us]: https://dashboard.heroku.com/apps/origami-build-service-v3-us
[heroku-qa]: https://dashboard.heroku.com/apps/origami-build-service-v3-qa
[heroku]: https://heroku.com/
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[pingdom-eu]: https://my.pingdom.com/newchecks/checks#check=2301115
[pingdom-us]: https://my.pingdom.com/newchecks/checks#check=2301117
[production-url]: https://www.ft.com/__origami/service/build/v3
[sentry-production]: https://sentry.io/nextftcom/origami-build-service-v3-producti/
[sentry-qa]: https://sentry.io/nextftcom/origami-build-service-v3-qa/
[service-options]: https://github.com/Financial-Times/origami-service#options
[splunk]: https://financialtimes.splunkcloud.com/en-US/app/search/origamibuildservicev3
