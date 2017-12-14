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

const TESTNAME = `3-binary-data`;
const PORT = 8083;

module.exports = {
  test: TESTNAME,
  cwd: path.resolve(path.join(__dirname, `../`)),
  cmd: `app`,
  port: PORT,
  env: {
    PORT: PORT
  },
  url: `http://localhost:${PORT}`,
  version: process.env.GAE_VERSION || TESTNAME,
  project: process.env.GCLOUD_PROJECT,
  msg: `Bookshelf`
};
