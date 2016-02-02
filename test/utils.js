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

var spawn = require('child_process').spawn;
var request = require('request');

// Send a request to the given url and test that the response body has the
// expected value
function testRequest(url, config, cb) {
  request(url, function (err, res, body) {
    if (err) {
      // Request error
      return cb(err);
    } else {
      if (body && body.indexOf(config.msg) !== -1 &&
            (res.statusCode === 200 || res.statusCode === config.code)) {
        // Success
        return cb(null, true);
      } else {
        // Short-circuit app test
        var message = config.test + ': failed verification!\n' +
                      'Expected: ' + config.msg + '\n' +
                      'Actual: ' + body;

        // Response body did not match expected
        return cb(new Error(message));
      }
    } 
  });
}

exports.testInstallation = function testInstallation(config, done) {

  // Keep track off whether "done" has been called yet
  var calledDone = false;

  var proc = spawn('npm', ['install'], {
    cwd: config.path
  });

  proc.on('error', finish);

  proc.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  proc.on('exit', function (code) {
    if (code !== 0) {
      finish(new Error(config.test + ': failed to install dependencies!'));
    } else {
      finish();
    }
  });

  // Exit helper so we don't call "cb" more than once
  function finish(err) {
    if (!calledDone) {
      calledDone = true;
      done(err);
    }
  }
};

exports.testLocalApp = function testLocalApp(config, done) {
  var calledDone = false;

  var proc = spawn(config.cmd, config.args, {
    cwd: config.path
  });

  proc.on('error', finish);

  if (!process.env.TRAVIS) {
    proc.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });
  }

  proc.on('exit', function (code, signal) {
    if (code !== 0 && signal !== 'SIGKILL') {
      return finish(new Error(config.test + ': failed to run!'));
    } else {
      return finish();
    }
  });

  // Give the server time to start up
  setTimeout(function () {
    // Test that the app is working
    testRequest('http://localhost:8080', config, function (err) {
      proc.kill('SIGKILL');
      setTimeout(function () {
        return finish(err);
      }, 1000);
    });
  }, 3000);

  // Exit helper so we don't call "cb" more than once
  function finish(err) {
    if (!calledDone) {
      calledDone = true;
      done(err);
    }
  }
};
