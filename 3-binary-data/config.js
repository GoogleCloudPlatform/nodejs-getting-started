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

var getConfig = module.exports = function () {
  return {
    port: process.env.PORT || 8080,

    // dataBackend can be 'datastore', 'cloudsql', or 'mongodb'. Be sure to
    // configure the appropriate settings for each storage engine below.
    // If you are unsure, use datastore as it requires no additional
    // configuration.
    dataBackend: process.env.BACKEND || 'datastore',

    // This is the id of your project in the Google Developers Console.
    gcloud: {
      projectId: process.env.GCLOUD_PROJECT || 'your-project-id'
    },

    // Typically you will create a bucket with the same name as your project ID.
    cloudStorageBucket: process.env.CLOUD_BUCKET || 'your-bucket-name',

    mysql: {
      user: process.env.MYSQL_USER || 'your-mysql-user',
      password: process.env.MYSQL_PASSWORD || 'your-mysql-password',
      host: process.env.MYSQL_HOST || 'your-mysql-host'
    },

    mongodb: {
      url: process.env.MONGO_URL || 'mongodb://localhost:27017',
      collection: process.env.MONGO_COLLECTION || 'books'
    }
  };
};

var config = getConfig();
var projectId = config.gcloud.projectId;
var cloudStorageBucket = config.cloudStorageBucket;

if (!projectId || projectId === 'your-project-id') {
  throw new Error('You must set the GCLOUD_PROJECT env var or add your ' +
    'project id to config.js!');
}

if (!cloudStorageBucket || cloudStorageBucket === 'your-bucket-name') {
  throw new Error('You must set the CLOUD_BUCKET env var or add your ' +
    'bucket name to config.js!');
}
