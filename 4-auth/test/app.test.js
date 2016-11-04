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

const assert = require(`assert`);
const config = require(`./config`);
const proxyquire = require(`proxyquire`).noPreserveCache();
const sinon = require(`sinon`);
const utils = require(`nodejs-repo-tools`);

describe(`app.js`, () => {
  if (!process.env.E2E_TESTS) {
    it(`should run`, (done) => {
      utils.testLocalApp(config, done);
    });
  }

  it(`should redirect / to /books`, (done) => {
    utils.getRequest(config)
      .get(`/`)
      .expect(302)
      .expect((response) => {
        assert.equal(response.text.includes(`Redirecting to /books`), true);
      })
      .end(done);
  });

  it(`should check config`, () => {
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

    nconfMock.DATA_BACKEND = `datastore`;

    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`GCLOUD_PROJECT`));

    nconfMock.GCLOUD_PROJECT = `project`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`CLOUD_BUCKET`));

    nconfMock.CLOUD_BUCKET = `bucket`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`OAUTH2_CLIENT_ID`));

    nconfMock.OAUTH2_CLIENT_ID = `foo`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`OAUTH2_CLIENT_SECRET`));

    nconfMock.OAUTH2_CLIENT_SECRET = `bar`;
    assert.doesNotThrow(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    });

    nconfMock.DATA_BACKEND = `cloudsql`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`MYSQL_USER`));
    nconfMock.MYSQL_USER = `user`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`MYSQL_PASSWORD`));
    nconfMock.MYSQL_PASSWORD = `password`;
    assert.doesNotThrow(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    });

    nconfMock.DATA_BACKEND = `mongodb`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`MONGO_URL`));
    nconfMock.MONGO_URL = `url`;
    assert.throws(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    }, Error, getMsg(`MONGO_COLLECTION`));
    nconfMock.MONGO_COLLECTION = `collection`;
    assert.doesNotThrow(() => {
      proxyquire(`../config`, { nconf: nconfMock });
    });
  });
});
