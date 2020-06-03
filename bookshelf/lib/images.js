// Copyright 2019, Google, Inc.
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

const GOOGLE_CLOUD_PROJECT = process.env['GOOGLE_CLOUD_PROJECT'];
const CLOUD_BUCKET = GOOGLE_CLOUD_PROJECT + '_bucket';

// [START bookshelf_cloud_storage_client]
const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
const bucket = storage.bucket(CLOUD_BUCKET);
// [END bookshelf_cloud_storage_client]

// Returns the public, anonymously accessible URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
// [START public_url]
function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}
// [END public_url]

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
// [START process]
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
    resumable: false,
  });

  stream.on('error', err => {
    req.file.cloudStorageError = err;
    next(err);
  });

  stream.on('finish', async () => {
    req.file.cloudStorageObject = gcsname;
    await file.makePublic();
    req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
    next();
  });

  stream.end(req.file.buffer);
}
// [END process]

// Multer handles parsing multipart/form-data requests.
// This instance is configured to store images in memory.
// This makes it straightforward to upload to Cloud Storage.
// [START multer]
const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
  },
});
// [END multer]

module.exports = {
  getPublicUrl,
  sendUploadToGCS,
  multer,
};
