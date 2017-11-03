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
export E2E_TESTS=true # test the deployed app
export DATA_BACKEND="cloudsql"

# Configure gcloud
export GCLOUD_PROJECT=nodejs-getting-started-tests
export GOOGLE_APPLICATION_CREDENTIALS=${KOKORO_GFILE_DIR}/secrets-key.json
gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project nodejs-getting-started-tests

# Install Node dependencies
yarn global add @google-cloud/nodejs-repo-tools
cd github/nodejs-getting-started/${BOOKSHELF_DIRECTORY}

# Initialize app.yaml
echo "runtime: nodejs
env: flex
skip_files:
  - ^node_modules$
" > app.yaml

# Copy secrets
cp ${KOKORO_GFILE_DIR}/secrets-config.json config.json
cp $GOOGLE_APPLICATION_CREDENTIALS key.json

# Deploy and test a single step
set +e;
export GAE_VERSION=${BOOKSHELF_DIRECTORY}-${DATA_BACKEND}
gcloud app deploy --version $GAE_VERSION # nodejs-repo-tools doesn't support specifying versions, so deploy manually
npm test
set -e;

# Post-test cleanup
gsutil -m cp */*.log gs://nodejs-getting-started-tests-deployment-logs || true

if [[ $CODE -ne 0 ]]; then
  exit $CODE
fi