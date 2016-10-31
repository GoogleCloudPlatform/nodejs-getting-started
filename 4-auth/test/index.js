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

const config = require(`./config`);
const utils = require(`nodejs-repo-tools`);

describe(`${config.test}/`, () => {
  if (!process.env.E2E_TESTS) {
    it(`should install dependencies`, (done) => {
      utils.testInstallation(config, done);
    }).timeout(120 * 1000);
  }
  require(`./app.test`);
  describe(`books/`, () => {
    const appConfig = require(`../config`);
    const DATA_BACKEND = appConfig.get(`DATA_BACKEND`);
    if (DATA_BACKEND === `datastore` || process.env.TEST_DATASTORE) {
      require(`./api.test`)(`datastore`);
      require(`./crud.test`)(`datastore`);
    }
    if (DATA_BACKEND === `cloudsql` || process.env.TEST_CLOUDSQL) {
      require(`./api.test`)(`cloudsql`);
      require(`./crud.test`)(`cloudsql`);
    }
    if (DATA_BACKEND === `mongodb` || process.env.TEST_MONGODB) {
      require(`./api.test`)(`mongodb`);
      require(`./crud.test`)(`mongodb`);
    }
  });
  if (!process.env.E2E_TESTS) {
    describe(`lib/`, () => {
      require(`./oauth2.test`);
    });
  }
});
