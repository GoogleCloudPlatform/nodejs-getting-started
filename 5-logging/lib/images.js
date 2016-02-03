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

var gcloud = require('gcloud');


module.exports = function(gcloudConfig, cloudStorageBucket) {

  var storage = gcloud.storage(gcloudConfig);
  var bucket = storage.bucket(cloudStorageBucket);


  // Returns the public, anonymously accessable URL to a given Cloud Storage
  // object.
  // The object's ACL has to be set to public read.
  function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' +
      cloudStorageBucket +
      '/' + filename;
  }

  // Express middleware that will automatically pass uploads to Cloud Storage.
  // req.file is processed and will have two new properties:
  // * ``cloudStorageObject`` the object name in cloud storage.
  // * ``cloudStoragePublicUrl`` the public url to the object.
  function sendUploadToGCS(req, res, next) {
    if(!req.file) { return next(); }

    var gcsname = Date.now() + req.file.originalname;
    var file = bucket.file(gcsname);
    var stream = file.createWriteStream();

    stream.on('error', function(err) {
      req.file.cloudStorageError = err;
      next(err);
    });

    stream.on('finish', function() {
      req.file.cloudStorageObject = gcsname;
      req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
      next();
    });

    stream.end(req.file.buffer);
  }


  // Multer handles parsing multipart/form-data requests.
  // This instance is configured to store images in memory and re-name to avoid
  // conflicting with existing objects. This makes it straightforward to upload
  // to Cloud Storage.
  var multer = require('multer')({
    inMemory: true,
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
    rename: function(fieldname, filename) {
      // generate a unique filename
      return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
    }
  });


  return {
    getPublicUrl: getPublicUrl,
    sendUploadToGCS: sendUploadToGCS,
    multer: multer
  };

};
