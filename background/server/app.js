// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START getting_started_background_app_main]

// This app is an HTTP app that displays all previous translations
// (stored in Firestore) and has a form to request new translations. On form
// submission, the request is sent to Pub/Sub to be processed in the background.

// TOPIC_NAME is the Pub/Sub topic to publish requests to. The Cloud Function to
// process translation requests should be subscribed to this topic.
const TOPIC_NAME = 'translate';

const express = require('express');
const bodyParser = require('body-parser');
const {PubSub} = require('@google-cloud/pubsub');
const {Firestore} = require('@google-cloud/firestore');

const app = express();
const port = process.env.PORT || 8080;

const firestore = new Firestore();

const pubsub = new PubSub();
const topic = pubsub.topic(TOPIC_NAME);

// Use handlebars.js for templating.
app.set('views', __dirname);
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', index);
app.post('/request-translation', requestTranslation);
app.listen(port, () => console.log(`Listening on port ${port}!`));

// [END getting_started_background_app_main]

// [START getting_started_background_app_list]

// index lists the current translations.
async function index(req, res) {
  const translations = [];
  const querySnapshot = await firestore.collection('translations').get();
  querySnapshot.forEach(doc => {
    console.log(doc.id, ' => ', doc.data());
    translations.push(doc.data());
  });

  res.render('index', {translations});
}

// [END getting_started_background_app_list]

// [START getting_started_background_app_request]

// requestTranslation parses the request, validates it, and sends it to Pub/Sub.
function requestTranslation(req, res) {
  const language = req.body.lang;
  const original = req.body.v;

  const acceptableLanguages = ['de', 'en', 'es', 'fr', 'ja', 'sw'];
  if (!acceptableLanguages.includes(language)) {
    throw new Error(`Invalid language ${language}`);
  }

  console.log(`Translation requested: ${original} -> ${language}`);

  const buffer = Buffer.from(JSON.stringify({language, original}));
  topic.publish(buffer);
  res.sendStatus(200);
}
// [END getting_started_background_app_request]
module.exports = app;
