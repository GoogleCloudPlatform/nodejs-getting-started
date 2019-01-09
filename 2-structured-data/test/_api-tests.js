// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const getRequest = require('@google-cloud/nodejs-repo-tools').getRequest;
const assert = require('assert');

module.exports = DATA_BACKEND => {
  let originalDataBackend, id, testConfig, appConfig;

  before(() => {
    testConfig = require('./_test-config');
    appConfig = require('../config');
    originalDataBackend = appConfig.get('DATA_BACKEND');
    appConfig.set('DATA_BACKEND', DATA_BACKEND);
  });

  after(() => {
    appConfig.set('DATA_BACKEND', originalDataBackend);
  });

  it('should create a book', async () => {
    await getRequest(testConfig)
      .post('/api/books')
      .send({title: 'beep'})
      .expect(200)
      .expect(response => {
        id = response.body.id;
        assert.ok(response.body.id);
        assert.strictEqual(response.body.title, 'beep');
      });
  });

  it('should list books', async () => {
    // Give Datastore time to become consistent
    await getRequest(testConfig)
      .get('/api/books')
      .expect(200)
      .expect(response => {
        assert.strictEqual(Array.isArray(response.body.items), true);
        assert.strictEqual(response.body.items.length >= 1, true);
      });
  });

  it('should delete a book', async () => {
    await getRequest(testConfig)
      .delete(`/api/books/${id}/`)
      .expect(200)
      .expect(response => {
        assert.strictEqual(response.text, 'OK');
      });
  });
};
