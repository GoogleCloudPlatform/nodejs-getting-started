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

// This file contains an async Cloud Function, translate, to translate text.
// The function listens to Pub/Sub, does the translations, and stores the
// result in Firestore.

// [START getting_started_background_translate_init]
const Firestore = require('@google-cloud/firestore');
const {Translate} = require('@google-cloud/translate').v2;

const firestore = new Firestore();
const translate = new Translate();
// [END getting_started_background_translate_init]

// [START getting_started_background_translate]
// translate translates the given message and stores the result in Firestore.
// Triggered by Pub/Sub message.
exports.translate = async pubSubEvent => {
  const {language, original} = JSON.parse(
    Buffer.from(pubSubEvent.data, 'base64').toString()
  );

  // [START getting_started_background_translate_string]
  const [
    translated,
    {
      data: {translations},
    },
  ] = await translate.translate(original, language);
  const originalLanguage = translations[0].detectedSourceLanguage;
  console.log(
    `Translated ${original} in ${originalLanguage} to ${translated} in ${language}.`
  );
  // [END getting_started_background_translate_string]

  // Store translation in firestore.
  await firestore
    .collection('translations')
    .doc()
    .set({
      language,
      original,
      translated,
      originalLanguage,
    });
};
// [END getting_started_background_translate]
