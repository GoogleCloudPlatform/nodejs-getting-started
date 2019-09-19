/**
 * Copyright 2019, Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// [START getting_started_auth_all]
const express = require('express');
const got = require('got');
const jwt = require('jsonwebtoken');

const app = express();

// Cache externally fetched information for future invocations
let certs;
let aud;

// [START getting_started_auth_certs]
async function certificates() {
  if (!certs) {
    let response = await got('https://www.gstatic.com/iap/verify/public_key');
    certs = JSON.parse(response.body);
  }

  return certs;
}
// [END getting_started_auth_certs]

async function getMetadata(itemName) {
  const endpoint = 'http://metadata.google.internal';
  const path = '/computeMetadata/v1/project/';
  const url = endpoint + path + itemName;

  let response = await got(url, {
    headers: {'Metadata-Flavor': 'Google'},
  });
  return response.body;
}

// [START getting_started_auth_metadata]
async function audience() {
  if (!aud) {
    let project_number = await getMetadata('numeric-project-id');
    let project_id = await getMetadata('project-id');

    aud = '/projects/' + project_number + '/apps/' + project_id;
  }

  return aud;
}
// [END getting_started_auth_metadata]

// [START getting_started_auth_audience]
async function validateAssertion(assertion) {
  if (!assertion) {
    return {};
  }
  // Decode the header to determine which certificate signed the assertion
  const encodedHeader = assertion.split('.')[0];
  const decodedHeader = Buffer.from(encodedHeader, 'base64').toString('utf8');
  const header = JSON.parse(decodedHeader);
  const keyId = header.kid;

  // Fetch the current certificates and verify the signature on the assertion
  const certs = await certificates();
  const payload = jwt.verify(assertion, certs[keyId]);

  // Check that the assertion's audience matches ours
  const aud = await audience();
  if (payload.aud !== aud) {
    throw new Error('Audience mismatch. {$payload.aud} should be {$aud}.');
  }

  // Return the two relevant pieces of information
  return {
    email: payload.email,
    sub: payload.sub,
  };
}
// [END getting_started_auth_audience]

// [START getting_started_auth_front_controller]
app.get('/', async (req, res) => {
  const assertion = req.header('X-Goog-IAP-JWT-Assertion');
  let email = 'None';
  try {
    const info = await validateAssertion(assertion);
    email = info.email
  } catch (error) {
    console.log(error);
  }
  res
      .status(200)
      .send(`Hello ${email}`)
      .end();
});

// [END getting_started_auth_front_controller]

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

// [END getting_started_auth_all]

module.exports = app;
