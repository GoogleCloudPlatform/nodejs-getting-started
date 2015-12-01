// Copyright 2015, Google, Inc.
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

var path = require('path');
var express = require('express');
var config = require('./config');

var app = express();

app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('trust proxy', true);


// Setup modules and dependencies
var images = require('./lib/images')(config.gcloud, config.cloudStorageBucket);
var model = require('./books/model-' + config.dataBackend)(config);

// Books
app.use('/books', require('./books/crud')(model, images));
app.use('/api/books', require('./books/api')(model));


// Redirect root to /books
app.get('/', function(req, res) {
  res.redirect('/books');
});


// Basic error handler
app.use(function(err, req, res, next) {
  /* jshint unused:false */
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


if (module === require.main) {
  // Start the server
  var server = app.listen(config.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
  });
}

module.exports = app;
