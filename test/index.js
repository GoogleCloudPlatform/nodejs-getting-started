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

var proxyquire = require('proxyquire').noPreserveCache();
var stubs = {};
var MongoClient = require('mongodb').MongoClient;

describe('Bookshelf app', function () {
  // require('../1-hello-world/test');
  // proxyquire('../2-structured-data/test', stubs);
  // proxyquire('../3-binary-data/test', stubs);
  proxyquire('../4-auth/test', stubs);
  // proxyquire('../5-logging/test', stubs);
  // proxyquire('../6-pubsub/test', stubs);
  // proxyquire('../7-gce/test', stubs);
  after(function (done) {
    var config = proxyquire('../7-gce/config', stubs);
    if (config.get('DATA_BACKEND') !== 'mongodb') {
      return done();
    }
    MongoClient.connect(config.get('MONGO_URL'), function (err, db) {
      if (err) {
        return done(err);
      }
      db.collection(config.get('MONGO_COLLECTION')).remove(done);
    });
  });
});
