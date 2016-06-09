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

var assert = require('assert');
var config = require('./config.worker');
var path = require('path');
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var supertest = require('supertest');
var utils = require('nodejs-repo-tools');

var projectId = process.env.GCLOUD_PROJECT;

function getUrl () {
  return 'http://' + config.test + '-dot-worker-dot-' + projectId +
    '.appspot.com';
}

function getRequest () {
  if (process.env.E2E_TESTS) {
    return supertest(getUrl());
  }
  return supertest(proxyquire(path.join(__dirname, '../worker'), {}).app);
}

describe('worker.js', function () {
  if (!process.env.E2E_TESTS) {
    it('should run', function (done) {
      utils.testLocalApp(config, done);
    });
  }

  it('should return number of processed books', function (done) {
    getRequest(config)
      .get('/')
      .expect(200)
      .expect(function (response) {
        assert.ok(response.text.indexOf('This worker has processed') !== -1);
      })
      .end(done);
  });

  it('should do a health check', function (done) {
    getRequest(config)
      .get('/_ah/health')
      .expect(200)
      .expect(function (response) {
        assert.equal(response.text, 'ok');
      })
      .end(done);
  });

  it('should process a book', function (done) {
    var appConfig = require('../config');
    var loggingStub = {
      error: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub()
    };
    var stubs = {
      './lib/logging': loggingStub,
      '@google/cloud-trace': {
        start: sinon.stub(),
        '@noCallThru': true
      },
      '@google/cloud-debug': {
        '@noCallThru': true
      }
    };
    stubs['./books/model-' + appConfig.get('DATA_BACKEND')] = {
      read: function (bookId, cb) {
        cb(null, {});
      },
      update: function (bookId, book, queueBook, cb) {
        cb();
      }
    };
    var worker = proxyquire(path.join(__dirname, '../worker'), stubs);
    var processBook = worker.processBook;

    processBook(1, function (err, bookId) {
      if (err) {
        return done(err);
      }
      assert(loggingStub.info.calledOnce);
      assert.equal(loggingStub.info.firstCall.args[0], 'Updated book 1');
      done();
    });
  });
});
