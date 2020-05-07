#!/bin/bash

# Fail on any error.
set -e

cd github/nodejs-getting-started/authenticating-users

npm install

npm test

