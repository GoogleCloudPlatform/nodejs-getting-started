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
const config = require(`./config`);
const utils = require(`nodejs-repo-tools`);

module.exports = (DATA_BACKEND) => {
  describe(`crud.js`, () => {
    let ORIG_DATA_BACKEND;

    before(() => {
      const appConfig = require(`../config`);
      ORIG_DATA_BACKEND = appConfig.get(`DATA_BACKEND`);
      appConfig.set(`DATA_BACKEND`, DATA_BACKEND);
    });

    describe(`/books`, () => {
      let id;

      // setup a book
      before((done) => {
        utils.getRequest(config)
          .post(`/api/books`)
          .send({ title: `my book` })
          .expect(200)
          .expect((response) => {
            id = response.body.id;
            assert.ok(response.body.id);
            assert.equal(response.body.title, `my book`);
          })
          .end(done);
      });

      it(`should show a list of books`, (done) => {
        // Give Datastore time to become consistent
        setTimeout(() => {
          const expected = `<div class="media-body">`;
          utils.getRequest(config)
            .get(`/books`)
            .expect(200)
            .expect((response) => {
              assert.equal(response.text.includes(expected), true);
            })
            .end(done);
        }, 2000);
      });

      it(`should handle error`, (done) => {
        utils.getRequest(config)
          .get(`/books`)
          .query({ pageToken: `badrequest` })
          .expect(500)
          .end(done);
      });

      // delete the book
      after((done) => {
        if (id) {
          utils.getRequest(config)
            .delete(`/api/books/${id}`)
            .expect(200)
            .end(done);
        } else {
          done();
        }
      });
    });

    describe(`/books/add`, () => {
      let id;

      it(`should post to add book form`, (done) => {
        utils.getRequest(config)
          .post(`/books/add`)
          .field(`title`, `my book`)
          .expect(302)
          .expect((response) => {
            const location = response.headers.location;
            const idPart = location.replace(`/books/`, ``);
            if (require(`../config`).get(`DATA_BACKEND`) !== `mongodb`) {
              id = parseInt(idPart, 10);
            } else {
              id = idPart;
            }
            assert.equal(response.text.includes(`Redirecting to /books/`), true);
          })
          .end(done);
      });

      it(`should show add book form`, (done) => {
        utils.getRequest(config)
          .get(`/books/add`)
          .expect(200)
          .expect((response) => {
            assert.equal(response.text.includes(`Add book`), true);
          })
          .end(done);
      });

      // delete the book
      after((done) => {
        if (id) {
          utils.getRequest(config)
            .delete(`/api/books/${id}`)
            .expect(200)
            .end(done);
        } else {
          done();
        }
      });
    });

    describe(`/books/:book/edit & /books/:book`, () => {
      let id;

      // setup a book
      before((done) => {
        utils.getRequest(config)
          .post(`/api/books`)
          .send({ title: `my book` })
          .expect(200)
          .expect((response) => {
            id = response.body.id;
            assert.ok(response.body.id);
            assert.equal(response.body.title, `my book`);
          })
          .end(done);
      });

      it(`should update a book`, (done) => {
        const expected = `Redirecting to /books/${id}`;
        utils.getRequest(config)
          .post(`/books/${id}/edit`)
          .field(`title`, `my other book`)
          .expect(302)
          .expect((response) => {
            assert.equal(response.text.includes(expected), true);
          })
          .end(done);
      });

      it(`should show edit book form`, (done) => {
        const expected =
          `<input type="text" name="title" id="title" value="my other book" class="form-control">`;
        utils.getRequest(config)
          .get(`/books/${id}/edit`)
          .expect(200)
          .expect((response) => {
            assert.equal(response.text.includes(expected), true);
          })
          .end(done);
      });

      it(`should show a book`, (done) => {
        const expected = `<h4>my other book&nbsp;<small></small></h4>`;
        utils.getRequest(config)
          .get(`/books/${id}`)
          .expect(200)
          .expect((response) => {
            assert.equal(response.text.includes(expected), true);
          })
          .end(done);
      });

      it(`should delete a book`, (done) => {
        const expected = `Redirecting to /books`;
        utils.getRequest(config)
          .get(`/books/${id}/delete`)
          .expect(302)
          .expect((response) => {
            id = undefined;
            assert.equal(response.text.includes(expected), true);
          })
          .end(done);
      });

      // clean up if necessary
      after((done) => {
        if (id) {
          utils.getRequest(config)
            .delete(`/api/books/${id}`)
            .expect(200)
            .end(done);
        } else {
          done();
        }
      });
    });

    after(() => {
      require(`../config`).set(`DATA_BACKEND`, ORIG_DATA_BACKEND);
    });
  });
};
