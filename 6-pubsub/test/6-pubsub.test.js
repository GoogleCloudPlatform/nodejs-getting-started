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
var path = require('path');
var request = require('supertest');
var utils = require('../../test/utils');

var config = {
  test: '6-pubsub',
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
        assert.ok(response.text.indexOf('Redirecting to /books') !== -1);
      })
      .end(done);
  });

  var id;

  it('should create a book', function (done) {
    request(require('../app'))
      .post('/api/books')
      .send({ foo: 'bar', title: 'beep' })
      .expect(200)
      .expect(function (response) {
        id = response.body.id;
        assert.ok(response.body.id);
        assert.equal(response.body.foo, 'bar');
        assert.equal(response.body.title, 'beep');
      })
      .end(done);
  });

  it('should list books', function (done) {
    request(require('../app'))
      .get('/api/books')
      .expect(200)
      .expect(function (response) {
        assert.ok(Array.isArray(response.body.items));
        assert.ok(response.body.items.length >= 1);
      })
      .end(done);
  });

  it('should delete a book', function (done) {
    request(require('../app'))
      .delete('/api/books/' + id)
      .expect(200)
      .expect(function (response) {
        assert.equal(response.text, 'OK');
      })
      .end(done);
  });

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
    utils.testLocalApp(config, done);
  });
});
