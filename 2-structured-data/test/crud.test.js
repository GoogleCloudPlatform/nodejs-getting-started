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

const test = require(`ava`);
const config = require(`./config`);
const utils = require(`nodejs-repo-tools`);

module.exports = (DATA_BACKEND) => {
  let ORIG_DATA_BACKEND;

  test.before(() => {
    const appConfig = require(`../config`);
    ORIG_DATA_BACKEND = appConfig.get(`DATA_BACKEND`);
    appConfig.set(`DATA_BACKEND`, DATA_BACKEND);
  });

  let id;

  // setup a book
  test.serial.cb(`should create a book`, (t) => {
    utils.getRequest(config)
      .post(`/api/books`)
      .send({ title: `my book` })
      .expect(200)
      .expect((response) => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.title, `my book`);
      })
      .end(t.end);
  });

  test.serial.cb(`should show a list of books`, (t) => {
    // Give Datastore time to become consistent
    setTimeout(() => {
      const expected = /<div class="media-body">/;
      utils.getRequest(config)
        .get(`/books`)
        .expect(200)
        .expect((response) => {
          t.regex(response.text, expected);
        })
        .end(done);
    }, 2000);
  });

  test.serial.cb(`should handle error`, (t) => {
    utils.getRequest(config)
      .get(`/books`)
      .query({ pageToken: `badrequest` })
      .expect(500)
      .end(t.end);
  });

  // delete the book
  test.serial.cb(() => {
    if (id) {
      utils.getRequest(config)
        .delete(`/api/books/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });

  test.serial.cb(`should post to add book form`, (t) => {
    const expected = /Redirecting to \/books\//;
    utils.getRequest(config)
      .post(`/books/add`)
      .send(`title=my%20book`)
      .expect(302)
      .expect((response) => {
        const location = response.headers.location;
        const idPart = location.replace(`/books/`, ``);
        if (require(`../config`).get(`DATA_BACKEND`) !== `mongodb`) {
          id = parseInt(idPart, 10);
        } else {
          id = idPart;
        }
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show add book form`, (t) => {
    const expected = /Add book/;
    utils.getRequest(config)
      .get(`/books/add`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  // delete the book
  test.serial.cb(() => {
    if (id) {
      utils.getRequest(config)
        .delete(`/api/books/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });

  // setup a book
  test.serial.cb((t) => {
    utils.getRequest(config)
      .post(`/api/books`)
      .send({ title: `my book` })
      .expect(200)
      .expect((response) => {
        id = response.body.id;
        t.truthy(response.body.id);
        t.is(response.body.title, `my book`);
      })
      .end(t.end);
  });

  test.serial.cb(`should update a book`, (t) => {
    const expected = /Redirecting to \/books/ + id  + /\//;
    utils.getRequest(config)
      .post(`/books/${id}/edit`)
      .send(`title=my%20other%20book`)
      .expect(302)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show edit book form`, (t) => {
    const expected =
      /<input type="text" name="title" id="title" value="my other book" class="form-control">/;
    utils.getRequest(config)
      .get(`/books/${id}/edit`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show a book`, (t) => {
    const expected = `<h4>my other book&nbsp;<small></small></h4>`;
    utils.getRequest(config)
      .get(`/books/${id}`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should delete a book`, (t) => {
    const expected = `Redirecting to /books`;
    utils.getRequest(config)
      .get(`/books/${id}/delete`)
      .expect(302)
      .expect((response) => {
        id = undefined;
        t.regex(response.text, expected);
      })
      .end(done);
  });

  // clean up
  test.always.after.cb((t) => {
    require(`../config`).set(`DATA_BACKEND`, ORIG_DATA_BACKEND);

    if (id) {
      utils.getRequest(config)
        .delete(`/api/books/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });
};
