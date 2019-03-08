// Copyright 2017, Google, Inc.
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

const request = require('request');
const Storage = require('@google-cloud/storage');
const config = require('../config');
const logging = require('./logging');

const CLOUD_BUCKET = config.get('CLOUD_BUCKET');

const storage = Storage();
const bucket = storage.bucket(CLOUD_BUCKET);

// Downloads a given image (by URL) and then uploads it to
// Google Cloud Storage. Provides the publicly accessable URL to the callback.
function downloadAndUploadImage(sourceUrl, destFileName, cb) {
  const file = bucket.file(destFileName);

  request
    .get(sourceUrl)
    .on('error', err => {
      logging.warn(`Could not fetch image ${sourceUrl}`, err);
      cb(err);
    })
    .pipe(file.createWriteStream())
    .on('finish', () => {
      logging.info(`Uploaded image ${destFileName}`);
      file.makePublic(() => {
        cb(null, getPublicUrl(destFileName));
      });
    })
    .on('error', err => {
      logging.error('Could not upload image', err);
      cb(err);
    });
}

// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
function sendUploadToGCS(req, res, next) {
  if (!req.file) {
    return next();
  }

  const gcsname = Date.now() + req.file.originalname;
  const file = bucket.file(gcsname);
  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  stream.on('error', err => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', () => {
    req.file.cloudStorageObject = gcsname;
    file.makePublic().then(() => {
      req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      next();
    });
  });

  stream.end(req.file.buffer);
}

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
  },
});

module.exports = {
  downloadAndUploadImage,
  getPublicUrl,
  sendUploadToGCS,
  multer,
};
