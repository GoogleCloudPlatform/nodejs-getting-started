# Getting started with Node.js on Google Cloud Platform

[![Build Status][travis-badge]][travis-link]
[![Coverage Status][coveralls-badge]][coveralls-link]

This repository contains the complete sample code for the
[Node.js Getting Started on Google Cloud Platform][getting-started] tutorials.
Please refer to the tutorials for instructions on configuring, running, and
deploying these samples.

The code for each tutorial is in an individual folder in this repository.

Tutorial | Folder
---------|-------
[Hello world][step-1] | [1-hello-world][step-1-code]
[Structured data][step-2] | [2-structured-data][step-2-code]
[Cloud Storage][step-3] | [3-binary-data][step-3-code]
[Authenticating users][step-4] | [4-auth][step-4-code]
[Logging app events][step-5] | [5-logging][step-5-code]
[Using Cloud Pub/Sub][step-6] | [6-pubsub][step-6-code]
[Deploying to Google Compute Engine][step-7] | [7-gce][step-7-code]

## Contributing changes

* See [CONTRIBUTING.md](CONTRIBUTING.md)

### Run the tests

* Make sure you're authenticated with the gcloud sdk and your gcloud project
has enabled all the APIs used by these tutorials.
* Make sure you've got the required environment variables set. (Take a look at
the various config.js files.)
* `git clone git@github.com:GoogleCloudPlatform/nodejs-getting-started.git`
* `cd nodejs-getting-started`
* `npm install`
* `npm test`

## Licensing

* See [LICENSE](LICENSE)

[travis-badge]: https://travis-ci.org/GoogleCloudPlatform/nodejs-getting-started.svg
[travis-link]: https://travis-ci.org/GoogleCloudPlatform/nodejs-getting-started
[coveralls-badge]: https://codecov.io/github/GoogleCloudPlatform/nodejs-getting-started/coverage.svg?branch=master
[coveralls-link]: https://codecov.io/github/GoogleCloudPlatform/nodejs-getting-started?branch=master
[getting-started]: http://cloud.google.com/nodejs/getting-started
[step-1]: https://cloud.google.com/nodejs/getting-started/hello-world
[step-1-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/1-hello-world
[step-2]: https://cloud.google.com/nodejs/getting-started/using-structured-data
[step-2-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/2-structured-data
[step-3]: https://cloud.google.com/nodejs/getting-started/using-cloud-storage
[step-3-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/3-binary-data
[step-4]: https://cloud.google.com/nodejs/getting-started/authenticate-users
[step-4-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/4-auth
[step-5]: https://cloud.google.com/nodejs/getting-started/logging-application-events
[step-5-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/5-logging
[step-6]: https://cloud.google.com/nodejs/getting-started/using-pub-sub
[step-6-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/6-pubsub
[step-7]: https://cloud.google.com/nodejs/getting-started/run-on-compute-engine
[step-7-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/7-gce
