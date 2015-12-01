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
  test: '1-hello-world',
  path: path.resolve(path.join(__dirname,  '../')),
  cmd: 'node',
  args: ['app.js'],
  msg: 'Hello, world!'
};

describe(config.test, function () {

  it('should install dependencies', function (done) {
    this.timeout(60 * 1000); // Allow 1 minute to test installation
    utils.testInstallation(config, done);
  });

  it('should create an express app', function (done) {
    request(require('../app'))
      .get('/')
      .expect(200)
      .expect(function (response) {
        assert.equal(response.text, config.msg);
      })
      .end(done);
  });

  it('should run', function (done) {
    this.timeout(15 * 1000); // Allow 15 seconds to test app
    utils.testLocalApp(config, done);
  });

  if (process.env.TRAVIS && process.env.TRAVIS_NODE_VERSION === 'stable') {
    it('should deploy', function (done) {
      this.timeout(10 * 60 * 1000); // Allow 10 minutes to deploy app :(
      utils.testDeployment(config, done);
    });
  }
});
