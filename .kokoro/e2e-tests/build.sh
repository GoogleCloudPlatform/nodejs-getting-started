#!/bin/bash

# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Fail on error
set -e;

# Remove old logs/YAML files
rm -rf */*.log
rm -rf *-*.yaml

# Load the Node version manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Install the latest version of Node 10
nvm install 10

export NODE_ENV=development
export E2E_TESTS=true # test the deployed app, used by repo-tools.getRequest()

# Register post-test cleanup
export GAE_VERSION=${BOOKSHELF_DIRECTORY:0:1}-${DATA_BACKEND}
function cleanup {
  CODE=$?

  gcloud app versions delete $GAE_VERSION
  if [ -e "worker.yaml" ]; then
    gcloud app versions delete ${GAE_VERSION}-worker
  fi
  gsutil -m cp */*.log gs://nodejs-getting-started-tests-deployment-logs || true

  # Update build badge
  BADGE_URL="gs://nodejs-getting-started-tests-badges"
  if [[ CODE -eq 0 ]]; then
    STATUS="passing"
  else
    STATUS="failing"
  fi
  gsutil cp ${BADGE_URL}/${DATA_BACKEND}-${STATUS}.svg ${BADGE_URL}/${GAE_VERSION}.svg
}
trap cleanup EXIT

# Configure gcloud
# Export the project as repo-tools e2e tests rely on it:
# `https://${opts.version}-dot-${opts.project}.appspot.com`.
export GCLOUD_PROJECT=nodejs-getting-started-tests
export GOOGLE_APPLICATION_CREDENTIALS=${KOKORO_GFILE_DIR}/secrets-key.json
gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project $GCLOUD_PROJECT

# Install Node dependencies
npm i -g @google-cloud/nodejs-repo-tools
cd github/nodejs-getting-started/${BOOKSHELF_DIRECTORY}

# Copy secrets
cp ${KOKORO_GFILE_DIR}/secrets-config.json config.json
cp $GOOGLE_APPLICATION_CREDENTIALS key.json

# Install dependencies (for running the tests, not the apps themselves)
npm install

# Deploy a single step
gcloud app deploy --version $GAE_VERSION --no-promote # nodejs-repo-tools doesn't support specifying versions, so deploy manually
if [ -e "worker.yaml" ]; then
  gcloud app deploy worker.yaml --version ${GAE_VERSION} --no-promote
fi

# Test the deployed step
npm test

# Exit on error
if [[ $CODE -ne 0 ]]; then
  exit $CODE
fi