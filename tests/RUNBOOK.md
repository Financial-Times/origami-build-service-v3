# Origami Build Service V3

Creates bundles of JavaScript and CSS from Origami (and Origami-compatible modules). See [the production service][production-url] for API information.

## Service Tier

Bronze

## Lifecycle Stage

Preproduction

## Primary URL

https://www.ft.com/__origami/service/build/v3

## Host Platform

AWS

## Contains Personal Data

no

## Contains Sensitive Data

no

## Delivered By

origami-team

## Supported By

origami-team

## Known About By

* jake.champion
* rowan.manning

## Dependencies

* npm
* github
* aws
* bower
* fastly
* dyn

## Healthchecks


## Failover Architecture Type

ActiveActive

## Failover Process Type

FullyAutomated

## Failback Process Type

FullyAutomated

## Data Recovery Process Type

NotApplicable

## Release Process Type

PartiallyAutomated

## Rollback Process Type

PartiallyAutomated

## Key Management Process Type

Manual

## Architecture Diagram

<p><a href="TODO">Google Drawing</a></p>

## Architecture

This is a work-in-progress application, and is in pre-production. We'll be updating this with some details on the architecture before we go live. What's known at the moment is that this runs on Node.js and does not depend on any other services.

## More Information

See the live service for more information.

## First Line Troubleshooting

This application is not critical outside of office hours and is in preproduction, please contact the Origami team and we'll fix when we're in the office.

## Second Line Troubleshooting

This is current a work-in-progress. For now it's best to speak to Jake, and we'll update this guide before we go live.

## Monitoring


## Failover Details

Our Fastly config automatically routes requests between the production EU and US applications. If one of those regions is down, Fastly will route all requests to the other region.

## Data Recovery Details

This application does not store any data.

## Release Details

The application is deployed to QA whenever a new commit is pushed to the `master` branch of this repo on GitHub. To release to production, the QA application must be manually promoted.

## Key Management Details

This app is not yet in production, once it is this information can be revisited.
