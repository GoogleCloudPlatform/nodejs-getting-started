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
const config = require(`./config.worker`);
const path = require(`path`);
const proxyquire = require(`proxyquire`);
const sinon = require(`sinon`);
const supertest = require(`supertest`);
const utils = require(`nodejs-repo-tools`);

const projectId = process.env.GCLOUD_PROJECT;

function getUrl () {
  return `http://${config.test}-dot-worker-dot-${projectId}.appspot-preview.com`;
}

function getRequest () {
  if (process.env.E2E_TESTS) {
    return supertest(getUrl());
  }
  return supertest(proxyquire(path.join(__dirname, `../worker`), {}).app);
}

describe(`worker.js`, () => {
  if (!process.env.E2E_TESTS) {
    it(`should run`, (done) => {
      utils.testLocalApp(config, done);
    });
  }

  it(`should return number of processed books`, (done) => {
    getRequest(config)
      .get(`/`)
      .expect(200)
      .expect((response) => {
        assert.equal(response.text.includes(`This worker has processed`), true);
      })
      .end(done);
  });

  it(`should do a health check`, (done) => {
    getRequest(config)
      .get(`/_ah/health`)
      .expect(200)
      .expect((response) => {
        assert.equal(response.text, `ok`);
      })
      .end(done);
  });

  it(`should process a book`, (done) => {
    const appConfig = require(`../config`);
    const loggingStub = {
      error: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub()
    };
    const stubs = {
      './lib/logging': loggingStub,
      '@google/cloud-trace': {
        start: sinon.stub(),
        '@noCallThru': true
      },
      '@google/cloud-debug': {
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
        return done(err);
      }
      assert(loggingStub.info.calledOnce);
      assert.equal(loggingStub.info.firstCall.args[0], `Updated book 1`);
      done();
    });
  });
});
