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
var config = require('./config');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var utils = require('nodejs-repo-tools');

describe('app.js', function () {
  if (!process.env.E2E_TESTS) {
    it('should run', function (done) {
      utils.testLocalApp(config, done);
    });
  }

  it('should redirect / to /books', function (done) {
    utils.getRequest(config)
      .get('/')
      .expect(302)
      .expect(function (response) {
        assert.ok(response.text.indexOf('Redirecting to /books') !== -1);
      })
      .end(done);
  });

  it('should check config', function () {
    var nconfMock = {
      argv: sinon.stub().returnsThis(),
      env: sinon.stub().returnsThis(),
      file: sinon.stub().returnsThis(),
      defaults: sinon.stub().returnsThis(),
      get: function (setting) {
        return this[setting];
      }
    };

    function getMsg (setting) {
      return 'You must set the ' + setting + ' environment variable or' +
      ' add it to config.json!';
    }

    nconfMock.DATA_BACKEND = 'datastore';

    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('GCLOUD_PROJECT'));

    nconfMock.GCLOUD_PROJECT = 'project';
    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('CLOUD_BUCKET'));

    nconfMock.CLOUD_BUCKET = 'bucket';
    assert.doesNotThrow(function () {
      proxyquire('../config', { nconf: nconfMock });
    });

    nconfMock.DATA_BACKEND = 'cloudsql';
    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('MYSQL_USER'));
    nconfMock.MYSQL_USER = 'user';
    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('MYSQL_PASSWORD'));
    nconfMock.MYSQL_PASSWORD = 'password';
    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('MYSQL_HOST'));
    nconfMock.MYSQL_HOST = 'host';
    assert.doesNotThrow(function () {
      proxyquire('../config', { nconf: nconfMock });
    });

    nconfMock.DATA_BACKEND = 'mongodb';
    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('MONGO_URL'));
    nconfMock.MONGO_URL = 'url';
    assert.throws(function () {
      proxyquire('../config', { nconf: nconfMock });
    }, Error, getMsg('MONGO_COLLECTION'));
    nconfMock.MONGO_COLLECTION = 'collection';
    assert.doesNotThrow(function () {
      proxyquire('../config', { nconf: nconfMock });
    });
  });
});
