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

const winston = require('winston');
const expressWinston = require('express-winston');
const StackdriverTransport = require('@google-cloud/logging-winston')
  .LoggingWinston;

const colorize = process.env.NODE_ENV !== 'production';

// Logger to capture all requests and output them to the console.
const requestLogger = expressWinston.logger({
  transports: [
    new StackdriverTransport(),
    new winston.transports.Console({
      json: false,
      colorize: colorize,
    }),
  ],
  expressFormat: true,
  meta: false,
});

// Logger to capture any top-level errors and output json diagnostic info.
const errorLogger = expressWinston.errorLogger({
  transports: [
    new StackdriverTransport(),
    new winston.transports.Console({
      json: true,
      colorize: colorize,
    }),
  ],
});

module.exports = {
  requestLogger: requestLogger,
  errorLogger: errorLogger,
  error: winston.error,
  warn: winston.warn,
  info: winston.info,
  log: winston.log,
  verbose: winston.verbose,
  debug: winston.debug,
  silly: winston.silly,
};
