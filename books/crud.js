/*
	Copyright 2015, Google, Inc. 
 Licensed under the Apache License, Version 2.0 (the "License"); 
 you may not use this file except in compliance with the License. 
 You may obtain a copy of the License at 
  
    http://www.apache.org/licenses/LICENSE-2.0 
  
 Unless required by applicable law or agreed to in writing, software 
 distributed under the License is distributed on an "AS IS" BASIS, 
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 See the License for the specific language governing permissions and 
 limitations under the License.
*/
"use strict";

var express = require('express');
var bodyParser = require('body-parser');


module.exports = function(model) {

  var router = express.Router();

  router.use(bodyParser.urlencoded({extended: false}));


  function handleRpcError(err, res) {
    res.status(err.code || 500).send(err.message);
  }


  router.use(function(req, res, next){
    res.set('Content-Type', 'text/html');
    next();
  });

  router.get('/', function list(req, res) {
    var books = model.list(10, req.query.pageToken,
      function(err, entities, cursor) {
        if (err) return handleRpcError(err, res);
        res.render('books/list.jade', {
          books: entities,
          nextPageToken: cursor
        });
      }
    );
  });

// [START add_get]
  router.get('/add', function addForm(req, res) {
    res.render('books/form.jade', {
      book: {},
      action: 'Add'
    });
  });
// [END add_get]


// [START add_post]
  router.post('/add', function insert(req, res) {
    var data = req.body;

    // Save the data to the database.
    model.create(data, function(err, savedData) {
      if (err) return handleRpcError(err, res);
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  });
// [END add_post]

  router.get('/:book/edit', function editForm(req, res) {
    model.read(req.params.book, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.render('books/form.jade', {
        book: entity,
        action: 'Edit'
      });
    });
  });

  router.post('/:book/edit', function update(req, res) {
    var data = req.body;

    model.update(req.params.book, req.body, function(err, savedData) {
      if (err) return handleRpcError(err, res);
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  });


  router.get('/:book', function get(req, res) {
    model.read(req.params.book, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.render('books/view.jade', {
        book: entity
      });
    });
  });


  router.get('/:book/delete', function _delete(req, res) {
    model.delete(req.params.book, function(err) {
      if (err) return handleRpcError(err, res);
      res.redirect(req.baseUrl);
    });
  });


  return router;

};
