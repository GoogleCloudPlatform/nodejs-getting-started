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

# Remove old logs/YAML files
rm -rf */*.log
rm -rf *-*.yaml

export NODE_ENV=development
export E2E_TESTS=true

export DATA_BACKEND="datastore"

# Set loglevels
npm config set loglevel warn

# Use latest version of Node v8
npm install -g n && n v8

echo "runtime: nodejs
env: flex
skip_files:
  - ^node_modules$
" > app.yaml

# Install gcloud
if [ ! -d $HOME/gcloud/google-cloud-sdk ]; then
  mkdir -p $HOME/gcloud &&
  wget https://dl.google.com/dl/cloudsdk/channels/rapid/google-cloud-sdk.tar.gz --directory-prefix=$HOME/gcloud &&
  cd $HOME/gcloud &&
  tar xzf google-cloud-sdk.tar.gz &&
  printf '\ny\n\ny\ny\n' | ./google-cloud-sdk/install.sh

  # Move back to starting directory
  cd /tmpfs/src
fi

source $HOME/.bashrc
source $HOME/gcloud/google-cloud-sdk/path.bash.inc
gcloud components update

# Configure gcloud
export GCLOUD_PROJECT=nodejs-getting-started-tests
export GOOGLE_APPLICATION_CREDENTIALS=${KOKORO_GFILE_DIR}/secrets-key.json
gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project nodejs-getting-started-tests

# Install Node dependencies
cd github/nodejs-getting-started
npm install -g yarn @google-cloud/nodejs-repo-tools
cd 7-gce
yarn install

# Copy secrets
cp ${KOKORO_GFILE_DIR}/secrets-config.json config.json
cp $GOOGLE_APPLICATION_CREDENTIALS key.json

# Deploy a single step
set +e;
npm run e2e;
set -e;

# Post-test cleanup
gsutil -m cp */*.log gs://nodejs-getting-started-tests-deployment-logs || true
rm -rf node_modules

if [[ $CODE -ne 0 ]]; then
  exit $CODE
fi