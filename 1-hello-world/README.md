# 1 - Hello world

![Build Status][ci-badge]

This folder contains the sample code for a small App Engine application that
displays a short message. See the instructions below for how to configure, run,
and deploy this sample.

[ci-badge]: https://storage.googleapis.com/nodejs-getting-started-tests-badges/1-tests.svg

# Simple instructions

1.  Install [Node.js](https://nodejs.org/en/).
1.  Install [git](https://git-scm.com/).
1.  Create a [Google Cloud Platform project](https://console.cloud.google.com).
1.  Install the [Google Cloud SDK](https://cloud.google.com/sdk/).

    * After downloading the SDK, initialize it:

            gcloud init

1.  Clone the repository:

        git clone https://github.com/GoogleCloudPlatform/nodejs-getting-started.git

1.  Change directory:

        cd nodejs-getting-started/1-hello-world

1.  Install dependencies:

        npm install

1.  Start the app:

        npm start

1.  View the app at [http://localhost:8080](http://localhost:8080).

1.  Stop the app by pressing `Ctrl+C`.

1.  Deploy the app:

        gcloud app deploy

1.  View the deployed app at [https://YOUR_PROJECT_ID.appspot.com](https://YOUR_PROJECT_ID.appspot.com).
