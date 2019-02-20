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

const getRequest = require('@google-cloud/nodejs-repo-tools').getRequest;
const assert = require('assert');

module.exports = DATA_BACKEND => {
  let originalDataBackend, id, testConfig, appConfig;

  before(() => {
    testConfig = require('./_test-config');
    appConfig = require('../config');
    originalDataBackend = appConfig.get('DATA_BACKEND');
    appConfig.set('DATA_BACKEND', DATA_BACKEND);
  });

  // clean up
  after(async () => {
    appConfig.set('DATA_BACKEND', originalDataBackend);
    await deleteBook(id);
  });

  // setup a book
  it('should create a book', async () => {
    await addBook();
  });

  it('should show a list of books', async () => {
    // Give Datastore time to become consistent
    const expected = /<div class="media-body">/;
    await getRequest(testConfig)
      .get('/books')
      .expect(200)
      .expect(response => {
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  it('should handle error', async () => {
    await getRequest(testConfig)
      .get('/books')
      .query({pageToken: 'badrequest'})
      .expect(500);
  });

  it('should post to add book form', async () => {
    await deleteBook(id);
    const expected = /Redirecting to \/books\//;
    await getRequest(testConfig)
      .post('/books/add')
      .send('title=my%20book')
      .expect(302)
      .expect(response => {
        const location = response.headers.location;
        const idPart = location.replace('/books/', '');
        if (DATA_BACKEND !== 'mongodb') {
          id = parseInt(idPart, 10);
        } else {
          id = idPart;
        }
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  it('should show add book form', async () => {
    const expected = /Add book/;
    await getRequest(testConfig)
      .get('/books/add')
      .expect(200)
      .expect(response => {
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  it('should update a book', async () => {
    // delete the book
    await deleteBook(id);
    // setup a book
    await addBook();
    const expected = new RegExp(`Redirecting to /books/${id}`);
    await getRequest(testConfig)
      .post(`/books/${id}/edit`)
      .send('title=my%20other%20book')
      .expect(302)
      .expect(response => {
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  it('should show edit book form', async () => {
    const expected = /<input class="form-control" type="text" name="title" id="title" value="my other book">/;
    await getRequest(testConfig)
      .get(`/books/${id}/edit`)
      .expect(200)
      .expect(response => {
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  it('should show a book', async () => {
    const expected = /<h4>my other book&nbsp;<small><\/small><\/h4>/;
    await getRequest(testConfig)
      .get(`/books/${id}`)
      .expect(200)
      .expect(response => {
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  it('should delete a book', async () => {
    const expected = /Redirecting to \/books/;
    await getRequest(testConfig)
      .get(`/books/${id}/delete`)
      .expect(302)
      .expect(response => {
        id = undefined;
        assert.strictEqual(expected.test(response.text), true);
      });
  });

  // setup a book
  async function addBook() {
    return await getRequest(testConfig)
      .post('/api/books')
      .send({title: 'my book'})
      .expect(200)
      .expect(response => {
        id = response.body.id;
        assert.ok(response.body.id);
        assert.strictEqual(response.body.title, 'my book');
      });
  }

  // delete the book
  async function deleteBook(id) {
    if (id) {
      return await getRequest(testConfig)
        .delete(`/api/books/${id}`)
        .expect(200);
    }
  }
};
