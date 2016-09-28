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

var request = require('request');
var gcloud = require('gcloud');
var config = require('../config');
var logging = require('./logging');

var CLOUD_BUCKET = config.get('CLOUD_BUCKET');

var storage = gcloud.storage({
  projectId: config.get('GCLOUD_PROJECT')
});
var bucket = storage.bucket(CLOUD_BUCKET);

// Downloads a given image (by URL) and then uploads it to
// Google Cloud Storage. Provides the publicly accessable URL to the callback.
// [START download_and_upload]
function downloadAndUploadImage (sourceUrl, destFileName, cb) {
  var file = bucket.file(destFileName);

  request
    .get(sourceUrl)
    .on('error', function (err) {
      logging.warn('Could not fetch image ' + sourceUrl, err);
      cb(err);
    })
    .pipe(file.createWriteStream())
    .on('finish', function () {
      logging.info('Uploaded image ' + destFileName);
      file.makePublic(function () {
        cb(null, getPublicUrl(destFileName));
      });
    })
    .on('error', function (err) {
      logging.error('Could not upload image', err);
      cb(err);
    });
}
// [END download_and_upload]

// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/' + CLOUD_BUCKET + '/' + filename;
}

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
function sendUploadToGCS (req, res, next) {
  if (!req.file) {
    return next();
  }

  var gcsname = Date.now() + req.file.originalname;
  var file = bucket.file(gcsname);
  var stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  stream.on('error', function (err) {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', function () {
    req.file.cloudStorageObject = gcsname;
    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
    next();
  });

  stream.end(req.file.buffer);
}

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
var Multer = require('multer');
var multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
});

module.exports = {
  downloadAndUploadImage: downloadAndUploadImage,
  getPublicUrl: getPublicUrl,
  sendUploadToGCS: sendUploadToGCS,
  multer: multer
};
