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

const path = require(`path`);
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const TESTNAME = `6-pubsub`;
const PORT = 8091;
const VERSION = `${process.env.GAE_VERSION || TESTNAME}`;

module.exports = {
  test: TESTNAME,
  url: `http://localhost:${PORT}`,
  yaml: `worker.yaml`,
  cwd: path.resolve(path.join(__dirname, `../`)),
  cmd: `worker`,
  msg: `This worker has processed`,
  port: PORT,
  env: {
    TOPIC_NAME: `book-process-queue-${TESTNAME}`,
  },
  version: VERSION,
  project: PROJECT_ID,
};

if (process.env.E2E_TESTS) {
  module.exports.testUrl = `https://${VERSION}-dot-worker-dot-${PROJECT_ID}.appspot.com`;
}
