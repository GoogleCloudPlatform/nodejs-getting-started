// Copyright 2017, Google, Inc.
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

const getRequest = require(`@google-cloud/nodejs-repo-tools`).getRequest;
const test = require(`ava`);

module.exports = (DATA_BACKEND) => {
  let originalDataBackend, id, testConfig, appConfig;

  test.before(() => {
    testConfig = require(`./_test-config`);
    appConfig = require(`../config`);
    originalDataBackend = appConfig.get(`DATA_BACKEND`);
    appConfig.set(`DATA_BACKEND`, DATA_BACKEND);
  });

  // setup a book
  test.serial.cb(`should create a book`, (t) => {
    getRequest(testConfig)
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
      getRequest(testConfig)
        .get(`/books`)
        .expect(200)
        .expect((response) => {
          t.regex(response.text, expected);
        })
        .end(t.end);
    }, 2000);
  });

  test.serial.cb(`should handle error`, (t) => {
    getRequest(testConfig)
      .get(`/books`)
      .query({ pageToken: `badrequest` })
      .expect(500)
      .end(t.end);
  });

  // delete the book
  test.serial.cb((t) => {
    if (id) {
      getRequest(testConfig)
        .delete(`/api/books/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });

  test.serial.cb(`should post to add book form`, (t) => {
    const expected = /Redirecting to \/books\//;
    getRequest(testConfig)
      .post(`/books/add`)
      .field(`title`, `my book`)
      .expect(302)
      .expect((response) => {
        const location = response.headers.location;
        const idPart = location.replace(`/books/`, ``);
        if (DATA_BACKEND !== `mongodb`) {
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
    getRequest(testConfig)
      .get(`/books/add`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  // delete the book
  test.serial.cb((t) => {
    if (id) {
      getRequest(testConfig)
        .delete(`/api/books/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });

  // setup a book
  test.serial.cb((t) => {
    getRequest(testConfig)
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
    const expected = new RegExp(`Redirecting to /books/${id}`);
    getRequest(testConfig)
      .post(`/books/${id}/edit`)
      .field(`title`, `my other book`)
      .expect(302)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show edit book form`, (t) => {
    const expected =
      /<input class="form-control" type="text" name="title" id="title" value="my other book">/;
    getRequest(testConfig)
      .get(`/books/${id}/edit`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should show a book`, (t) => {
    const expected = /<h4>my other book&nbsp;<small><\/small><\/h4>/;
    getRequest(testConfig)
      .get(`/books/${id}`)
      .expect(200)
      .expect((response) => {
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  test.serial.cb(`should delete a book`, (t) => {
    const expected = /Redirecting to \/books/;
    getRequest(testConfig)
      .get(`/books/${id}/delete`)
      .expect(302)
      .expect((response) => {
        id = undefined;
        t.regex(response.text, expected);
      })
      .end(t.end);
  });

  // clean up
  test.always.after.cb((t) => {
    appConfig.set(`DATA_BACKEND`, originalDataBackend);

    if (id) {
      getRequest(testConfig)
        .delete(`/api/books/${id}`)
        .expect(200)
        .end(t.end);
    } else {
      t.end();
    }
  });
};
