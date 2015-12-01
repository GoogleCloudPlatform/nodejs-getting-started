// Copyright 2015, Google, Inc.
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
var path = require('path');
var request = require('supertest');
var utils = require('../../test/utils');

var config = {
  test: '4-auth',
  path: path.resolve(path.join(__dirname,  '../')),
  cmd: 'node',
  args: ['app.js'],
  msg: 'No books found.'
};

describe(config.test, function () {

  it('should install dependencies', function (done) {
    this.timeout(60 * 1000); // Allow 1 minute to test installation
    utils.testInstallation(config, done);
  });

  it('should redirect / to /books', function (done) {
    request(require('../app'))
      .get('/')
      .expect(302)
      .expect(function (response) {
        assert.equal(response.text, 'Found. Redirecting to /books');
      })
      .end(done);
  });

  if (process.env.TEST_PROJECT_ID) {
    it('should list books', function (done) {
      request(require('../app'))
        .get('/books')
        .expect(200)
        .expect(function (response) {
          assert.ok(response.text.indexOf(config.msg) !== -1);
        })
        .end(done);
    });
  }

  it('should show add book form', function (done) {
    request(require('../app'))
      .get('/books/add')
      .expect(200)
      .expect(function (response) {
        assert.ok(response.text.indexOf('Add book') !== -1);
      })
      .end(done);
  });

  it('should run', function (done) {
    this.timeout(15 * 1000); // Allow 15 seconds to test app
    utils.testLocalApp(config, done);
  });
});
