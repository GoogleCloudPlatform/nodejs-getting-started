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

var request = require('request');
var gcloud = require('gcloud');


module.exports = function (gcloudConfig, cloudStorageBucket, logging) {

  var storage = gcloud.storage(gcloudConfig);
  var bucket = storage.bucket(cloudStorageBucket);


  /*
    Downloads a given image (by URL) and then uploads it to Google Cloud Storage.
    Provides the publicly accessable URL to the callback.
  */
  // [START download_and_upload]
  function downloadAndUploadImage(sourceUrl, destFileName, cb) {

    var file = bucket.file(destFileName);

    request
      .get(sourceUrl)
      .on('error', function(err) {
        logging.warn('Could not fetch image ' + sourceUrl, err);
        cb(err);
      })
      .pipe(file.createWriteStream())
      .on('complete', function() {
        logging.info('Uploaded image ' + destFileName);
        file.makePublic(function(){
          cb(null, getPublicUrl(destFileName));
        });
      })
      .on('error', function(err) {
        logging.error('Could not upload image', err);
        cb(err);
      });
  }
  // [END download_and_upload]


  /*
    Returns the public, anonymously accessible URL to a given Cloud Storage object.
    The object's ACL has to be set to public read.
  */
  function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' + cloudStorageBucket + '/' + filename;
  }


  /*
    Express middleware that will automatically pass uploads to Cloud Storage.
    Each file in req.files is processed and will have two new properties:
    * ``cloudStorageObject`` the object name in cloud storage.
    * ``cloudStoragePublicUrl`` the public url to the object.
  */
  function processUploads(req, resp, next) {

    var numFiles = Object.keys(req.files).length;
    if (!numFiles) return next();

    function checkNext(err) {
      numFiles--;
      if (numFiles === 0) next();
    }

    Object.keys(req.files).forEach(function(key) {
      var uploadedFile = req.files[key];
      var file = bucket.file(uploadedFile.name);
      var stream = file.createWriteStream();

      stream.on('error', function(err) {
        uploadedFile.cloudStorageError = err;
        checkNext();
      });

      stream.on('complete', function() {
        uploadedFile.cloudStorageObject = uploadedFile.name;
        uploadedFile.cloudStoragePublicUrl = getPublicUrl(uploadedFile.name);
        file.makePublic(checkNext);
      });

      stream.end(uploadedFile.buffer);
    });
  }


  /*
    Multer handles parsing multipart/form-data requests.
    This instance is configured to store images in memory and re-name to avoid
    conflicting with existing objects. This makes it straightforward to upload
    to Cloud Storage.
  */
  var multer = require('multer');
  multer = multer({
    inMemory: true,
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
    rename: function(fieldname, filename) {
      // generate a unique filename
      return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
    }
  });


  return {
    downloadAndUploadImage: downloadAndUploadImage,
    getPublicUrl: getPublicUrl,
    processUploads: processUploads,
    multer: multer
  };

};
