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

const testConfig = require(`./_test-config.worker`);
const path = require(`path`);
const proxyquire = require(`proxyquire`);
const sinon = require(`sinon`);
const supertest = require(`supertest`);
const test = require(`ava`);
const utils = require(`nodejs-repo-tools`);

const projectId = process.env.GCLOUD_PROJECT;

function getUrl () {
  return `http://${testConfig.test}-dot-worker-dot-${projectId}.appspot-preview.com`;
}

function getRequest () {
  if (process.env.E2E_TESTS) {
    return supertest(getUrl());
  }
  return supertest(proxyquire(path.join(__dirname, `../worker`), {}).app);
}

if (!process.env.E2E_TESTS) {
  test.serial.cb(`should run`, (t) => {
    utils.testLocalApp(testConfig, t.end);
  });
}

test.serial.cb(`should return number of processed books`, (t) => {
  getRequest(testConfig)
    .get(`/`)
    .expect(200)
    .expect((response) => {
      t.regex(response.text, /This worker has processed/);
    })
    .end(t.end);
});

test.serial.cb(`should do a health check`, (t) => {
  getRequest(testConfig)
    .get(`/_ah/health`)
    .expect(200)
    .expect((response) => {
      t.is(response.text, `ok`);
    })
    .end(t.end);
});

test.serial.cb(`should process a book`, (t) => {
  const appConfig = require(`../config`);
  const loggingStub = {
    error: sinon.stub(),
    info: sinon.stub(),
    warn: sinon.stub()
  };
  const stubs = {
    './lib/logging': loggingStub,
    '@google-cloud/trace-agent': {
      start: sinon.stub(),
      '@noCallThru': true
    },
    '@google-cloud/debug-agent': {
      '@noCallThru': true
    }
  };
  stubs[`./books/model-${appConfig.get('DATA_BACKEND')}`] = {
    read: (bookId, cb) => {
      cb(null, {});
    },
    update: (bookId, book, queueBook, cb) => {
      cb();
    }
  };
  const worker = proxyquire(path.join(__dirname, `../worker`), stubs);
  const processBook = worker.processBook;

  processBook(1, (err, bookId) => {
    if (err) {
      return t.end(err);
    }
    t.true(loggingStub.info.calledOnce);
    t.is(loggingStub.info.firstCall.args[0], `Updated book 1`);
    t.end();
  });
});
