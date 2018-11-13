# Getting started with Node.js on Google Cloud Platform

This repository contains the complete sample code for the
[Node.js Getting Started on Google Cloud Platform][getting-started] tutorials.
Please refer to the tutorials for instructions on configuring, running, and
deploying these samples.

The code for each tutorial is in an individual folder in this repository.

Tutorial | Folder | Build Status
---------|--------|-------------
[Hello world][step-1] | [1-hello-world][step-1-code] | ![Build Status][ci-badge-tests-1]
[Structured data][step-2] | [2-structured-data][step-2-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-2] ![Datastore Build Status][ci-badge-datastore-2] ![MongoDB Build Status][ci-badge-mongodb-2]
[Cloud Storage][step-3] | [3-binary-data][step-3-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-3] ![Datastore Build Status][ci-badge-datastore-3] ![MongoDB Build Status][ci-badge-mongodb-3]
[Authenticating users][step-4] | [4-auth][step-4-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-4] ![Datastore Build Status][ci-badge-datastore-4] ![MongoDB Build Status][ci-badge-mongodb-4]
[Logging app events][step-5] | [5-logging][step-5-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-5] ![Datastore Build Status][ci-badge-datastore-5] ![MongoDB Build Status][ci-badge-mongodb-5]
[Using Cloud Pub/Sub][step-6] | [6-pubsub][step-6-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-6] ![Datastore Build Status][ci-badge-datastore-6] ![MongoDB Build Status][ci-badge-mongodb-6]
[Deploying to Google Compute Engine][step-7] | [7-gce][step-7-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-7] ![Datastore Build Status][ci-badge-datastore-7] ![MongoDB Build Status][ci-badge-mongodb-7]
[Deploying to Google Kubernetes Engine][step-optional] | [optional-kubernetes-engine][step-optional-code] | ![Cloud SQL Build Status][ci-badge-cloudsql-optional] ![Datastore Build Status][ci-badge-datastore-optional] ![MongoDB Build Status][ci-badge-mongodb-optional]

## Contributing changes

* See [CONTRIBUTING.md](CONTRIBUTING.md)

### Run the tests

* Make sure you're authenticated with the `gcloud` SDK and your GCP project
has enabled all the APIs used by these tutorials.
* Make sure you've got the required environment variables set. (Take a look at
the various `config.js` files.)
```bash
git clone git@github.com:GoogleCloudPlatform/nodejs-getting-started.git
cd nodejs-getting-started
npm install
npm test
```

## Licensing

* See [LICENSE](LICENSE)

[getting-started]: https://cloud.google.com/nodejs/getting-started/tutorial-app
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
[step-optional]: https://cloud.google.com/nodejs/tutorials/bookshelf-on-kubernetes-engine
[step-optional-code]: https://github.com/GoogleCloudPlatform/nodejs-getting-started/tree/master/optional-kubernetes-engine

[ci-badge-tests-1]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/1-tests.svg
[ci-badge-datastore-2]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/2-datastore.svg
[ci-badge-cloudsql-2]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/2-cloudsql.svg
[ci-badge-mongodb-2]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/2-mongodb.svg
[ci-badge-datastore-3]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/3-datastore.svg
[ci-badge-cloudsql-3]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/3-cloudsql.svg
[ci-badge-mongodb-3]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/3-mongodb.svg
[ci-badge-datastore-4]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/4-datastore.svg
[ci-badge-cloudsql-4]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/4-cloudsql.svg
[ci-badge-mongodb-4]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/4-mongodb.svg
[ci-badge-datastore-5]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/5-datastore.svg
[ci-badge-cloudsql-5]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/5-cloudsql.svg
[ci-badge-mongodb-5]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/5-mongodb.svg
[ci-badge-datastore-6]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/6-datastore.svg
[ci-badge-cloudsql-6]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/6-cloudsql.svg
[ci-badge-mongodb-6]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/6-mongodb.svg
[ci-badge-datastore-7]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/7-datastore.svg
[ci-badge-cloudsql-7]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/7-cloudsql.svg
[ci-badge-mongodb-7]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/7-mongodb.svg
[ci-badge-datastore-optional]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/o-datastore.svg
[ci-badge-cloudsql-optional]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/o-cloudsql.svg
[ci-badge-mongodb-optional]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/o-mongodb.svg
