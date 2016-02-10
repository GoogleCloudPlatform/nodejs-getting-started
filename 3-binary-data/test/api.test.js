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
var request = require('supertest');
var proxyquire = require('proxyquire').noPreserveCache();
var stubs = {};

describe('api.js', function () {
  var id;

  it('should create a book', function (done) {
    request(proxyquire('../app', stubs))
      .post('/api/books')
      .send({ title: 'beep' })
      .expect(200)
      .expect(function (response) {
        id = response.body.id;
        assert.ok(response.body.id);
        assert.equal(response.body.title, 'beep');
      })
      .end(done);
  });

  it('should list books', function (done) {
    request(proxyquire('../app', stubs))
      .get('/api/books')
      .expect(200)
      .expect(function (response) {
        assert.ok(Array.isArray(response.body.items));
        assert.ok(response.body.items.length >= 1);
      })
      .end(done);
  });

  it('should delete a book', function (done) {
    request(proxyquire('../app', stubs))
      .delete('/api/books/' + id)
      .expect(200)
      .expect(function (response) {
        assert.equal(response.text, 'OK');
      })
      .end(done);
  });
});
