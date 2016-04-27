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

var utils = require('nodejs-repo-tools');

var steps = [
  require('../1-hello-world/test/config'),
  require('../2-structured-data/test/config'),
  require('../3-binary-data/test/config'),
  require('../4-auth/test/config'),
  require('../5-logging/test/config'),
  require('../6-pubsub/test/config'),
  require('../7-gce/test/config')
];

var workerSteps = [
  require('../6-pubsub/test/config.worker'),
  require('../7-gce/test/config.worker')
];

function tryToFinish (numTests, steps, done) {
  var doneCount = 0;
  var errCount = 0;
  var err = '';
  steps.forEach(function (config) {
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
  console.log('' + doneCount + ' deployments completed..');
  console.log('' + errCount + ' errors so far...');
  if (doneCount === numTests) {
    console.log('All tests complete!');
    if (errCount) {
      done(err || 'Unknown failure!');
    } else {
      done();
    }
  } else {
    console.log('' + (numTests - doneCount) + ' deployments remaining...');
  }
}

it('should deploy all app steps', function (done) {
  var numTests = 0;

  steps.forEach(function (config) {
    numTests++;
    utils.testDeploy(config, function (err) {
      config.err = err;
      config.done = true;
      tryToFinish(numTests, steps, done);
    });
  });
});

it('should deploy all worker steps', function (done) {
  var numTests = 0;

  workerSteps.forEach(function (config) {
    numTests++;
    utils.testDeploy(config, function (err) {
      config.err = err;
      config.done = true;
      tryToFinish(numTests, workerSteps, done);
    });
  });
});
