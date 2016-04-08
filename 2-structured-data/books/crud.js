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

var express = require('express');
var bodyParser = require('body-parser');

module.exports = function (model) {
  var router = express.Router();

  // Automatically parse request body as form data
  router.use(bodyParser.urlencoded({ extended: false }));

  // Set Content-Type for all responses for these routes
  router.use(function (req, res, next) {
    res.set('Content-Type', 'text/html');
    next();
  });

  /**
   * GET /books/add
   *
   * Display a page of books (up to ten at a time).
   */
  router.get('/', function list (req, res, next) {
    model.list(10, req.query.pageToken, function (err, entities, cursor) {
      if (err) {
        return next(err);
      }
      res.render('books/list.jade', {
        books: entities,
        nextPageToken: cursor
      });
    });
  });

  /**
   * GET /books/add
   *
   * Display a form for creating a book.
   */
  // [START add_get]
  router.get('/add', function addForm (req, res) {
    res.render('books/form.jade', {
      book: {},
      action: 'Add'
    });
  });
  // [END add_get]

  /**
   * POST /books/add
   *
   * Create a book.
   */
  // [START add_post]
  router.post('/add', function insert (req, res, next) {
    var data = req.body;

    // Save the data to the database.
    model.create(data, function (err, savedData) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  });
  // [END add_post]

  /**
   * GET /books/:id/edit
   *
   * Display a book for editing.
   */
  router.get('/:book/edit', function editForm (req, res, next) {
    model.read(req.params.book, function (err, entity) {
      if (err) {
        return next(err);
      }
      res.render('books/form.jade', {
        book: entity,
        action: 'Edit'
      });
    });
  });

  /**
   * POST /books/:id/edit
   *
   * Update a book.
   */
  router.post('/:book/edit', function update (req, res, next) {
    var data = req.body;

    model.update(req.params.book, data, function (err, savedData) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  });

  /**
   * GET /books/:id
   *
   * Display a book.
   */
  router.get('/:book', function get (req, res, next) {
    model.read(req.params.book, function (err, entity) {
      if (err) {
        return next(err);
      }
      res.render('books/view.jade', {
        book: entity
      });
    });
  });

  /**
   * GET /books/:id/delete
   *
   * Delete a book.
   */
  router.get('/:book/delete', function _delete (req, res, next) {
    model.delete(req.params.book, function (err) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl);
    });
  });

  /**
   * Errors on "/books/*" routes.
   */
  router.use(function handleRpcError (err, req, res, next) {
    // Format error and forward to generic error handler for logging and
    // responding to the request
    err.response = err.message;
    next(err);
  });

  return router;
};
