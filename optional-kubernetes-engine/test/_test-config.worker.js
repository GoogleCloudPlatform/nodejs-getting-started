// Copyright 2018, Google, Inc.
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
const test = `optional-kubernetes-engine-worker`;
const port = 8093;

module.exports = {
  test: test,
  url: `http://localhost:${port}`,
  yaml: `worker.yaml`,
  cwd: path.resolve(path.join(__dirname, `../`)),
  cmd: `worker`,
  msg: `This worker has processed`,
  port: port,
  env: {
    SUBSCRIPTION_NAME: `shared-worker-subscription-${test}`,
    TOPIC_NAME: `book-process-queue-${test}`,
  },
};
