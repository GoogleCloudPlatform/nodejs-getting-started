// Copyright 2019, Google, Inc.
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

// [START bookshelf_firestore_client]
const {Firestore} = require('@google-cloud/firestore');

const db = new Firestore();
const collection = 'Book';

// [END bookshelf_firestore_client]

// Lists all books in the database sorted alphabetically by title.
// The callback is invoked with ``(err, books, nextPageToken)``.
function list(limit, token, cb) {
  db.collection(collection)
    .orderBy('title')
    .startAfter(token || '')
    .limit(limit)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        cb(null, [], false);
      }
      const res = [];
      snapshot.forEach(doc => {
        let book = doc.data();
        book.id = doc.id;
        res.push(book);
      });
      snapshot.query
        .offset(limit)
        .get()
        .then(q => {
          cb(null, res, q.empty ? false : res[res.length - 1].title);
        });
    })
    .catch(cb);
}

// Creates a new book or updates an existing book with new data.
function update(id, data, cb) {
  let ref;
  if (id === null) {
    ref = db.collection(collection).doc();
  } else {
    ref = db.collection(collection).doc(id);
  }

  data.id = ref.id;
  data = {...data};
  ref
    .set(data)
    .then(() => cb(null, data))
    .catch(cb);
}

function create(data, cb) {
  update(null, data, cb);
}

// [START bookshelf_firestore_client_get_book]
function read(id, cb) {
  db.collection(collection)
    .doc(id)
    .get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
        cb('No such document!');
      } else {
        cb(null, doc.data());
      }
    })
    .catch(err => {
      cb(err);
    });
}
// [END bookshelf_firestore_client_get_book]

function _delete(id, cb) {
  db.collection(collection)
    .doc(id)
    .delete()
    .then(() => cb())
    .catch(cb);
}

module.exports = {
  create,
  read,
  update,
  delete: _delete,
  list,
};
