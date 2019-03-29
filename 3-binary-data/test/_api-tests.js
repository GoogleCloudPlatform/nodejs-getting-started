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

const getRequest = require(`@google-cloud/nodejs-repo-tools`).getRequest;
const test = require(`ava`);

module.exports = () => {
  let id, testConfig;

  test.before(() => {
    testConfig = require(`./_test-config`);
  });

  test.serial.cb(`should create a book`, t => {
    getRequest(testConfig)
      .post(`/api/books`)
      .send({title: `beep`})
      .expect(200)
      .expect(response => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.title, `beep`);
      })
      .end(t.end);
  });

  test.serial.cb(`should list books`, t => {
    // Give Datastore time to become consistent
    setTimeout(() => {
      getRequest(testConfig)
        .get(`/api/books`)
        .expect(200)
        .expect(response => {
          t.true(Array.isArray(response.body.items));
          t.true(response.body.items.length >= 1);
        })
        .end(t.end);
    }, 1000);
  });

  test.serial.cb(`should delete a book`, t => {
    getRequest(testConfig)
      .delete(`/api/books/${id}/`)
      // .expect(200)
      .expect(response => {
        t.is(response.text, `OK`);
      })
      .end(t.end);
  });
};
