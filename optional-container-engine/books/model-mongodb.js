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
var ObjectID = require('mongodb').ObjectID;
var config = require('../config');
var background = require('../lib/background');

var collection;

function fromMongo (item) {
  if (Array.isArray(item) && item.length) {
    item = item[0];
  }
  item.id = item._id;
  delete item._id;
  return item;
}

function toMongo (item) {
  delete item.id;
  return item;
}

function getCollection (cb) {
  if (collection) {
    setImmediate(function () {
      cb(null, collection);
    });
    return;
  }
  MongoClient.connect(config.get('MONGO_URL'), function (err, db) {
    if (err) {
      return cb(err);
    }
    collection = db.collection(config.get('MONGO_COLLECTION'));
    cb(null, collection);
  });
}

function list (limit, token, cb) {
  token = token ? parseInt(token, 10) : 0;
  if (isNaN(token)) {
    return cb(new Error('invalid token'));
  }
  getCollection(function (err, collection) {
    if (err) {
      return cb(err);
    }
    collection.find({})
      .skip(token)
      .limit(limit)
      .toArray(function (err, results) {
        if (err) {
          return cb(err);
        }
        var hasMore =
          results.length === limit ? token + results.length : false;
        cb(null, results.map(fromMongo), hasMore);
      });
  });
}

function listBy (userid, limit, token, cb) {
  token = token ? parseInt(token, 10) : 0;
  if (isNaN(token)) {
    return cb(new Error('invalid token'));
  }
  getCollection(function (err, collection) {
    if (err) {
      return cb(err);
    }
    collection.find({ createdById: userid })
      .skip(token)
      .limit(limit)
      .toArray(function (err, results) {
        if (err) {
          return cb(err);
        }
        var hasMore =
          results.length === limit ? token + results.length : false;
        cb(null, results.map(fromMongo), hasMore);
      });
  });
}

function create (data, queueBook, cb) {
  getCollection(function (err, collection) {
    if (err) {
      return cb(err);
    }
    collection.insert(data, {w: 1}, function (err, result) {
      if (err) {
        return cb(err);
      }
      var item = fromMongo(result.ops);
      if (queueBook) {
        background.queueBook(item.id);
      }
      cb(null, item);
    });
  });
}

function read (id, cb) {
  getCollection(function (err, collection) {
    if (err) {
      return cb(err);
    }
    collection.findOne({
      _id: new ObjectID(id)
    }, function (err, result) {
      if (err) {
        return cb(err);
      }
      if (!result) {
        return cb({
          code: 404,
          message: 'Not found'
        });
      }
      cb(null, fromMongo(result));
    });
  });
}

function update (id, data, queueBook, cb) {
  getCollection(function (err, collection) {
    if (err) {
      return cb(err);
    }
    collection.update(
      { _id: new ObjectID(id) },
      { '$set': toMongo(data) },
      { w: 1 },
      function (err) {
        if (err) {
          return cb(err);
        }
        if (queueBook) {
          background.queueBook(id);
        }
        return read(id, cb);
      }
    );
  });
}

function _delete (id, cb) {
  getCollection(function (err, collection) {
    if (err) {
      return cb(err);
    }
    collection.remove({
      _id: new ObjectID(id)
    }, cb);
  });
}

module.exports = {
  create: create,
  read: read,
  update: update,
  delete: _delete,
  list: list,
  listBy: listBy
};
