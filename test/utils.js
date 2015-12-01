// Copyright 2015, Google, Inc.
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
var fs = require('fs');
var async = require('async');
var projectId = process.env.TEST_PROJECT_ID || 'nodejs-docs-samples';

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

  if (!process.env.TRAVIS) {
    proc.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });
  }

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

exports.testDeployment = function testDeployment(config, done) {

  // Keep track off whether "cb" has been called yet
  var calledDone = false;
  // Keep track off whether the logs have fully flushed
  var logFinished = false;

  var _cwd = config.path;
  var args = [
    'preview',
    'app',
    'deploy',
    'app.yaml',
    // Skip prompt
    '-q',
    '--project',
    projectId,
    // Deploy over existing version so we don't have to clean up
    '--version',
    config.test,
    // Override any existing deployment
    '--force',
    config.promote ? '--promote' : '--no-promote',
    // Build locally, much faster
    '--docker-build',
    config.dockerBuild ? config.dockerBuild : 'local',
    '--verbosity',
    'debug'
  ];

  console.log(_cwd + ' $ gcloud ' + args.join(' '));

  var logFile = (process.env.TRAVIS_BUILD_DIR || _cwd + '/..') + 
                '/' +
                config.test + 
                '-' +
                (process.env.TRAVIS_BUILD_ID || 0) +
                '-' +
                (process.env.TRAVIS_BUILD_NUMBER || 0) +
                '-' +
                (process.env.TRAVIS_JOB_ID || 0) +
                '-' +
                (process.env.TRAVIS_JOB_NUMBER || 0) +
                '.log';

  var logStream = fs.createWriteStream(logFile, { flags: 'a' });

  // Don't use "npm run deploy" because we need extra flags
  var proc = spawn('gcloud', args, {
    cwd: _cwd
  });

  // Exit helper so we don't call "cb" more than once
  function finish(err, result) {
    if (!calledDone) {
      calledDone = true;
      var intervalId = setInterval(function () {
        if (logFinished) {
          clearInterval(intervalId);
          done(err, result);
        }
      }, 1000);
    }
  }

  logStream.on('finish', function () {
    if (!logFinished) {
      logFinished = true;
    }
  });

  proc.stdout.pipe(logStream, { end: false });
  proc.stderr.pipe(logStream, { end: false });

  var numEnded = 0;

  function finishLogs() {
    numEnded++;
    if (numEnded === 2) {
      logStream.end();
      console.log('Saved logs for ' + config.test + ' to ' + logFile);
    }
  }
  
  proc.stdout.on('end', finishLogs);
  proc.stderr.on('end', finishLogs);

  // This is called if the process fails to start. "error" event may or may
  // not be fired in addition to the "exit" event.
  proc.on('error', finish);

  // Process has completed
  proc.on('exit', function (code) {
    if (code !== 0) { // Deployment failed
      // Pass error as second argument so we don't short-circuit the
      // parallel tasks
      return finish(new Error(config.test + ': failed to deploy!'));
    } else { // Deployment succeeded
      // Test that sample app is running successfully
      return async.waterfall([
        function (cb) {
          // Give apps time to start
          setTimeout(cb, 5000);
        },
        function (cb) {
          // Test versioned url of "default" module
          var demoUrl = 'http://' + config.test + '-dot-' + projectId +
            '.appspot.com';
          testRequest(demoUrl, config, cb);
        }
      ], finish);
    }
  });
};
