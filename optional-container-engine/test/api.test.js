// Copyright 2015-2016, Google, Inc.
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

const test = require(`ava`);
const config = require(`./config`);
const utils = require(`nodejs-repo-tools`);

module.exports = (DATA_BACKEND) => {
  let ORIG_DATA_BACKEND;
  let id;

  const appConfig = require(`../config`);
  ORIG_DATA_BACKEND = appConfig.get(`DATA_BACKEND`);
  appConfig.set(`DATA_BACKEND`, DATA_BACKEND);

  test.serial.cb(`should create a book`, (t) => {
    utils.getRequest(config)
      .post(`/api/books`)
      .send({ title: `beep` })
      .expect(200)
      .expect((response) => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.title, `beep`);
      })
      .end(t.end);
  });

  test.serial.cb(`should list books`, (t) => {
    // Give Datastore time to become consistent
    setTimeout(() => {
      utils.getRequest(config)
        .get(`/api/books`)
        .expect(200)
        .expect((response) => {
          t.true(Array.isArray(response.body.items));
          t.true(response.body.items.length >= 1);
        })
        .end(t.end);
    }, 1000);
  });

  test.serial.cb(`should delete a book`, (t) => {
    utils.getRequest(config)
      .delete(`/api/books/${id}/`)
      //.expect(200)
      .expect((response) => {
        t.is(response.text, `OK`);
      })
      .end(t.end);
  });

  test.always.after(() => {
    require(`../config`).set(`DATA_BACKEND`, ORIG_DATA_BACKEND);
  });
};

