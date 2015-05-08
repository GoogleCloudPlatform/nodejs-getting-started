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

  router.use(bodyParser.json());


  function handleRpcError(err, res) {
    if (err.code == 404) return res.status(404);
    res.status(500).json({
      message: err.message,
      internalCode: err.code
    });
  }


  router.get('/', function list(req, res) {
    model.list(10, req.query.pageToken,
      function(err, entities, cursor) {
        if (err) return handleRpcError(err, res);
        res.json({
          items: entities,
          nextPageToken: cursor
        });
      });
  });


  router.post('/', function insert(req, res) {
    model.create(req.body, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.json(entity);
    });
  });


  router.get('/:book(\\d+)', function get(req, res) {
    model.read(req.params.book, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.json(entity);
    });
  });


  router.put('/:book(\\d+)', function update(req, res) {
    model.update(req.params.book, req.body, function(err, entity) {
      if (err) return handleRpcError(err, res);
      res.json(entity);
    });
  });


  router.delete('/:book(\\d+)', function _delete(req, res) {
    model.delete(req.params.book, function(err) {
      if (err) return handleRpcError(err, res);
      res.status(200).send('OK');
    });
  });

  return router;

};
