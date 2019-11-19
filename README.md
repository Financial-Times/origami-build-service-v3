
Origami Build Service
=====================

Creates bundles of JavaScript and CSS from [Origami components](https://registry.origami.ft.com/components).

[![Build status](https://img.shields.io/circleci/project/Financial-Times/origami-build-service-v3.svg)][ci]
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


Table Of Contents
-----------------

  * [Requirements](#requirements)
  * [Running Locally](#running-locally)
  * [License](#license)


Requirements
------------

- NodeJS 10 or higher
- python3 and pip (python package manager)
- Docker
- localstack (`pip install localstack` or `pip3 install localstack`)

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




License
-------

The Financial Times has published this software under the [MIT license][license].


[ci]: https://circleci.com/gh/Financial-Times/origami-build-service-v3

[license]: http://opensource.org/licenses/MIT