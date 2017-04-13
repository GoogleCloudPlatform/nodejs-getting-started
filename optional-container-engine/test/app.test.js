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

const testConfig = require(`./_test-config`);
const proxyquire = require(`proxyquire`).noPreserveCache();
const sinon = require(`sinon`);
const test = require(`ava`);
const utils = require(`nodejs-repo-tools`);

if (!process.env.E2E_TESTS) {
  test.cb(`should run`, (t) => {
    utils.testLocalApp(testConfig, t.end);
  });
}

test.cb(`should redirect / to /books`, (t) => {
  utils.getRequest(testConfig)
    .get(`/`)
    .expect(302)
    .expect((response) => {
      t.regex(response.text, /Redirecting to \/books/);
    })
    .end(t.end);
});

test(`should check config`, (t) => {
  const nconfMock = {
    argv: sinon.stub().returnsThis(),
    env: sinon.stub().returnsThis(),
    file: sinon.stub().returnsThis(),
    defaults: sinon.stub().returnsThis(),
    get: function (setting) {
      return this[setting];
    }
  };

  function getMsg (setting) {
    return `You must set ${setting} as an environment variable or in config.json!`;
  }

  const testFunc = () => {
    proxyquire(`../config`, { nconf: nconfMock });
  };

  nconfMock.DATA_BACKEND = `datastore`;

  t.throws(testFunc, Error, getMsg(`GCLOUD_PROJECT`));
  nconfMock.GCLOUD_PROJECT = `project`;

  t.throws(testFunc, Error, getMsg(`CLOUD_BUCKET`));
  nconfMock.CLOUD_BUCKET = `bucket`;

  t.throws(testFunc, Error, getMsg(`OAUTH2_CLIENT_ID`));
  nconfMock.OAUTH2_CLIENT_ID = `foo`;

  t.throws(testFunc, Error, getMsg(`OAUTH2_CLIENT_SECRET`));
  nconfMock.OAUTH2_CLIENT_SECRET = `bar`;

  t.notThrows(testFunc);

  nconfMock.DATA_BACKEND = `cloudsql`;

  t.throws(testFunc, Error, getMsg(`MYSQL_USER`));
  nconfMock.MYSQL_USER = `user`;

  t.throws(testFunc, Error, getMsg(`MYSQL_PASSWORD`));
  nconfMock.MYSQL_PASSWORD = `password`;

  t.notThrows(testFunc);

  nconfMock.DATA_BACKEND = `mongodb`;

  t.throws(testFunc, Error, getMsg(`MONGO_URL`));
  nconfMock.MONGO_URL = `url`;

  t.throws(testFunc, Error, getMsg(`MONGO_COLLECTION`));
  nconfMock.MONGO_COLLECTION = `collection`;

  t.notThrows(testFunc);
});
