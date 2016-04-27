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
var utils = require('nodejs-repo-tools');

module.exports = function (DATA_BACKEND) {
  describe('crud.js', function () {
    var ORIG_DATA_BACKEND;

    before(function () {
      var appConfig = require('../config');
      ORIG_DATA_BACKEND = appConfig.get('DATA_BACKEND');
      appConfig.set('DATA_BACKEND', DATA_BACKEND);
    });

    describe('/books', function () {
      var id;

      // setup a book
      before(function (done) {
        utils.getRequest(config)
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
        // Give Datastore time to become consistent
        setTimeout(function () {
          var expected = '<div class="media-body">';
          utils.getRequest(config)
            .get('/books')
            .expect(200)
            .expect(function (response) {
              assert.ok(response.text.indexOf(expected) !== -1);
            })
            .end(done);
        }, 2000);
      });

      it('should handle error', function (done) {
        utils.getRequest(config)
          .get('/books')
          .query({ pageToken: 'badrequest' })
          .expect(500)
          .end(done);
      });

      // delete the book
      after(function (done) {
        if (id) {
          utils.getRequest(config)
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
        utils.getRequest(config)
          .post('/books/add')
          .send('title=my%20book')
          .expect(302)
          .expect(function (response) {
            var location = response.headers.location;
            var idPart = location.replace('/books/', '');
            if (require('../config').get('DATA_BACKEND') !== 'mongodb') {
              id = parseInt(idPart, 10);
            } else {
              id = idPart;
            }
            assert.ok(response.text.indexOf('Redirecting to /books/') !== -1);
          })
          .end(done);
      });

      it('should show add book form', function (done) {
        utils.getRequest(config)
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
          utils.getRequest(config)
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
        utils.getRequest(config)
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
        utils.getRequest(config)
          .post('/books/' + id + '/edit')
          .send('title=my%20other%20book')
          .expect(302)
          .expect(function (response) {
            assert.ok(response.text.indexOf(expected) !== -1);
          })
          .end(done);
      });

      it('should show edit book form', function (done) {
        var expected = '<input type="text" name="title" id="title" ' +
                       'value="my other book" class="form-control">';
        utils.getRequest(config)
          .get('/books/' + id + '/edit')
          .expect(200)
          .expect(function (response) {
            assert.ok(response.text.indexOf(expected) !== -1);
          })
          .end(done);
      });

      it('should show a book', function (done) {
        var expected = '<h4>my other book&nbsp;<small></small></h4>';
        utils.getRequest(config)
          .get('/books/' + id)
          .expect(200)
          .expect(function (response) {
            assert.ok(response.text.indexOf(expected) !== -1);
          })
          .end(done);
      });

      it('should delete a book', function (done) {
        var expected = 'Redirecting to /books';
        utils.getRequest(config)
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
          utils.getRequest(config)
            .delete('/api/books/' + id)
            .expect(200)
            .end(done);
        } else {
          done();
        }
      });
    });

    after(function () {
      require('../config').set('DATA_BACKEND', ORIG_DATA_BACKEND);
    });
  });
};
