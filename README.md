
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

We install the dependencies inside a Docker container that mimics AWS Lambda's environment because we have dependencies that are environment specific (meaning they only work on the environment they are installed on. I.E. Installing on OS X and running on Linux will not work).
```sh
npm run install-mac
```

Run the application in development mode with:

This will start localstack in a Docker container.

On OS X run:
```sh
npm run start-localstack-mac
```

On linux run:
```sh
npm run start-localstack
```

To deploy the project into localstack:
Don't worry about the output saying, the below, that is expected.
>Serverless Error ---------------------------------------
> 
>Not Found
On OS X run:
```sh
npm run deploy-local-mac
```

On linux run:
```sh
npm run deploy-local
```

Take note of the endpoints that serverless printed to the console, they will be wait we use to interact with the application. They look something like this:
>Service Information
>service: obs
>stage: local
>region: us-east-1
>stack: obs-local
>resources: 18
>api keys:
>  None
>endpoints:
>  GET - http://localhost:4567/restapis/s7mywpb4zh/local/_user_request_/v3/bundles/js
>  GET - http://localhost:4567/restapis/s7mywpb4zh/local/_user_request_/v3/update-origami-component-list

Import fixture data into the application:

```sh
npm run bootstrap
```

Now you can access the app over HTTP on the endpoints listed by Serverless.




License
-------

The Financial Times has published this software under the [MIT license][license].


[ci]: https://circleci.com/gh/Financial-Times/origami-build-service-v3

[license]: http://opensource.org/licenses/MIT