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

describe('crud.js', function () {
  describe('/books', function () {
    var id;

    // setup a book
    before(function (done) {
      request(proxyquire('../app', stubs))
        .post('/api/books')
        .send({ title: 'my book' })
        .expect(200)
        .expect(function (response) {
          id = response.body.id;
          assert.ok(response.body.id);
          assert.equal(response.body.title, 'my book');
        })
        .end(done);
    });

    it('should show a list of books', function (done) {
      var expected = '<div class="media-body"><h4>my book</h4><p></p></div>';
      request(proxyquire('../app', stubs))
        .get('/books')
        .expect(200)
        .expect(function (response) {
          assert.ok(response.text.indexOf(expected) !== -1);
        })
        .end(done);
    });

    it('should handle error', function (done) {
      request(proxyquire('../app', stubs))
        .get('/books')
        .query({ pageToken: 'badrequest' })
        .expect(500)
        .end(done);
    });

    // delete the book
    after(function (done) {
      if (id) {
        request(proxyquire('../app', stubs))
          .delete('/api/books/' + id)
          .expect(200)
          .end(done);
      } else {
        done();
      }
    });
  });

  describe('/books/add', function () {
    var id;

    it('should post to add book form', function (done) {
      request(proxyquire('../app', stubs))
        .post('/books/add')
        .field('title', 'my book')
        .expect(302)
        .expect(function (response) {
          var location = response.headers.location;
          var idPart = location.replace('/books/', '');
          if (require('../config')().dataBackend !== 'mongodb') {
            id = parseInt(idPart, 10);
          } else {
            id = idPart;
          }
          assert.ok(response.text.indexOf('Redirecting to /books/') !== -1);
        })
        .end(done);
    });

    it('should show add book form', function (done) {
      request(proxyquire('../app', stubs))
        .get('/books/add')
        .expect(200)
        .expect(function (response) {
          assert.ok(response.text.indexOf('Add book') !== -1);
        })
        .end(done);
    });

    // delete the book
    after(function (done) {
      if (id) {
        request(proxyquire('../app', stubs))
          .delete('/api/books/' + id)
          .expect(200)
          .end(done);
      } else {
        done();
      }
    });
  });

  describe('/books/:book/edit & /books/:book', function () {
    var id;

    // setup a book
    before(function (done) {
      request(proxyquire('../app', stubs))
        .post('/api/books')
        .send({ title: 'my book' })
        .expect(200)
        .expect(function (response) {
          id = response.body.id;
          assert.ok(response.body.id);
          assert.equal(response.body.title, 'my book');
        })
        .end(done);
    });

    it('should update a book', function (done) {
      var expected = 'Redirecting to /books/' + id;
      request(proxyquire('../app', stubs))
        .post('/books/' + id + '/edit')
        .field('title', 'my other book')
        .expect(302)
        .expect(function (response) {
          assert.ok(response.text.indexOf(expected) !== -1);
        })
        .end(done);
    });

    it('should show edit book form', function (done) {
      var expected = '<input type="text" name="title" id="title" ' +
                     'value="my other book" class="form-control">';
      request(proxyquire('../app', stubs))
        .get('/books/' + id + '/edit')
        .expect(200)
        .expect(function (response) {
          assert.ok(response.text.indexOf(expected) !== -1);
        })
        .end(done);
    });

    it('should show a book', function (done) {
      var expected = '<h4>my other book&nbsp;<small></small></h4>';
      request(proxyquire('../app', stubs))
        .get('/books/' + id)
        .expect(200)
        .expect(function (response) {
          assert.ok(response.text.indexOf(expected) !== -1);
        })
        .end(done);
    });

    it('should delete a book', function (done) {
      var expected = 'Redirecting to /books';
      request(proxyquire('../app', stubs))
        .get('/books/' + id + '/delete')
        .expect(302)
        .expect(function (response) {
          id = undefined;
          assert.ok(response.text.indexOf(expected) !== -1);
        })
        .end(done);
    });

    // clean up if necessary
    after(function (done) {
      if (id) {
        request(proxyquire('../app', stubs))
          .delete('/api/books/' + id)
          .expect(200)
          .end(done);
      } else {
        done();
      }
    });
  });
});
