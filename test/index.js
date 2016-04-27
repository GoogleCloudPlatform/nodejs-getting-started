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

var MongoClient = require('mongodb').MongoClient;

describe('Bookshelf app', function () {
  require('../1-hello-world/test');
  require('../2-structured-data/test');
  require('../3-binary-data/test');
  require('../4-auth/test');
  require('../5-logging/test');
  require('../6-pubsub/test');
  require('../7-gce/test');
  after(function (done) {
    var config = require('../7-gce/config');
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
