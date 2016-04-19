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

var extend = require('lodash').assign;
var mysql = require('mysql');
var config = require('../config');

function getConnection () {
  return mysql.createConnection(extend({
    database: 'library'
  }, {
    host: config.get('MYSQL_HOST'),
    user: config.get('MYSQL_USER'),
    password: config.get('MYSQL_PASSWORD')
  }));
}

// [START list]
function list (limit, token, cb) {
  token = token ? parseInt(token, 10) : 0;
  var connection = getConnection();
  connection.query(
    'SELECT * FROM `books` LIMIT ? OFFSET ?', [limit, token],
    function (err, results) {
      if (err) {
        return cb(err);
      }
      var hasMore = results.length === limit ? token + results.length : false;
      cb(null, results, hasMore);
    }
  );
  connection.end();
}
// [END list]

// [START create]
function create (data, cb) {
  var connection = getConnection();
  connection.query('INSERT INTO `books` SET ?', data, function (err, res) {
    if (err) {
      return cb(err);
    }
    read(res.insertId, cb);
  });
  connection.end();
}
// [END create]

function read (id, cb) {
  var connection = getConnection();
  connection.query(
    'SELECT * FROM `books` WHERE `id` = ?', id, function (err, results) {
      if (err) {
        return cb(err);
      }
      if (!results.length) {
        return cb({
          code: 404,
          message: 'Not found'
        });
      }
      cb(null, results[0]);
    });
  connection.end();
}

// [START update]
function update (id, data, cb) {
  var connection = getConnection();
  connection.query(
    'UPDATE `books` SET ? WHERE `id` = ?', [data, id], function (err) {
      if (err) {
        return cb(err);
      }
      read(id, cb);
    });
  connection.end();
}
// [END update]

function _delete (id, cb) {
  var connection = getConnection();
  connection.query('DELETE FROM `books` WHERE `id` = ?', id, cb);
  connection.end();
}

module.exports = {
  createSchema: createSchema,
  list: list,
  create: create,
  read: read,
  update: update,
  delete: _delete
};

if (module === require.main) {
  var prompt = require('prompt');
  prompt.start();

  console.log(
    'Running this script directly will allow you to initialize your mysql ' +
    'database.\n This script will not modify any existing tables.\n');

  prompt.get(['host', 'user', 'password'], function (err, result) {
    if (err) {
      return;
    }
    createSchema(result);
  });
}

function createSchema (config) {
  var connection = mysql.createConnection(extend({
    multipleStatements: true
  }, config));

  connection.query(
    'CREATE DATABASE IF NOT EXISTS `library` DEFAULT CHARACTER SET = ' +
    '\'utf8\' DEFAULT COLLATE \'utf8_general_ci\'; ' +
    'USE `library`; ' +
    'CREATE TABLE IF NOT EXISTS `library`.`books` ( ' +
    '`id` INT UNSIGNED NOT NULL AUTO_INCREMENT, ' +
    '`title` VARCHAR(255) NULL, ' +
    '`author` VARCHAR(255) NULL, ' +
    '`publishedDate` VARCHAR(255) NULL, ' +
    '`imageUrl` VARCHAR(255) NULL, ' +
    '`description` TEXT NULL, ' +
    '`createdBy` VARCHAR(255) NULL, ' +
    '`createdById` VARCHAR(255) NULL, ' +
    'PRIMARY KEY (`id`));',
    function (err) {
      if (err) {
        throw err;
      }
      console.log('Successfully created schema');
      connection.end();
    }
  );
}
