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

const async = require(`async`);
const utils = require(`nodejs-repo-tools`);

const steps = [
  // Standard steps
  require(`../1-hello-world/test/config`),
  require(`../2-structured-data/test/config`),
  require(`../3-binary-data/test/config`),
  require(`../4-auth/test/config`),
  require(`../5-logging/test/config`),
  require(`../6-pubsub/test/config`),
  require(`../7-gce/test/config`),

  // Worker steps
  require(`../6-pubsub/test/config.worker`),
  require(`../7-gce/test/config.worker`)
];

function tryToFinish (numTests, steps, done) {
  let doneCount = 0;
  let errCount = 0;
  let err = ``;
  steps.forEach((config) => {
    if (config.done) {
      doneCount++;
    }
    if (config.err) {
      errCount++;
      if (err) {
        err += '\n';
      }
      err += config.err.message || config.err;
    }
  });
  console.log(`${doneCount} deployments completed...`);
  console.log(`${errCount} errors so far...`);
  if (doneCount === numTests) {
    console.log(`All tests complete!`);
  } else {
    console.log(`${(numTests - doneCount)} deployments remaining...`);
  }

  if (errCount) {
    done(err || `Unknown failure!`);
  } else {
    done();
  }
}

before((done) => {
  // Delete existing versions
  async.each(steps, (config, cb) => {
    console.log(`Deletion queued for version ${config.test}...`);
    utils.deleteVersion(config.test, config.cwd, () => {
      console.log(`Deleted version ${config.test}!`);
      cb();
    });
  }, done);
});

it(`should deploy all steps`, (done) => {
  let numTests = steps.length;
  async.eachLimit(steps, 5, (config, cb) => {
    // Attempt to deploy version
    utils.testDeploy(config, (err) => {
      config.err = err;
      config.done = true;
      tryToFinish(numTests, steps, () => {
        // Delete version, if possible
        console.log(`Deletion queued for version ${config.test}...`);
        utils.deleteVersion(config.test, config.cwd, () => {
          console.log(`Deleted version ${config.test}!`);
          cb();
        });
      });
    });
  }, done);
});
