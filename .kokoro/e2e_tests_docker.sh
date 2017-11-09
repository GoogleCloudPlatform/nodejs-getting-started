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

# This file is used for testing the 'optional-container-engine' step
# Whereas the other steps are GAE Apps, this runs on K8s

# Remove old logs/YAML files
rm -rf */*.log
rm -rf *-*.yaml

export NODE_ENV=development
export E2E_TESTS=true # test the deployed app

# Register post-test cleanup
function cleanup {
  CODE=$?

  # Delete the K8s resources
  set +e
  kubectl delete -f bookshelf-frontend.yaml || true
  kubectl delete -f bookshelf-service.yaml || true
  kubectl delete -f bookshelf-worker.yaml || true

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
set -e;

# Configure gcloud
export GCLOUD_PROJECT=nodejs-getting-started-tests
export GOOGLE_APPLICATION_CREDENTIALS=${KOKORO_GFILE_DIR}/secrets-key.json
gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project nodejs-getting-started-tests

# Install Node dependencies
yarn global add @google-cloud/nodejs-repo-tools
cd github/nodejs-getting-started/${BOOKSHELF_DIRECTORY}

# Copy secrets
cp ${KOKORO_GFILE_DIR}/secrets-config.json config.json
cp $GOOGLE_APPLICATION_CREDENTIALS key.json

# Install dependencies (for running the tests, not the apps themselves)
yarn install

# Create configuration
echo "{
  \"GCLOUD_PROJECT\": \"$GCLOUD_PROJECT\",
  \"CLOUD_BUCKET\": \"nodejs-getting-started-tests-k8s\",
  \"DATA_BACKEND\": \"$DATA_BACKEND\"
}
" > config.json

# Build and deploy Docker images
sudo docker build -t gcr.io/${GCLOUD_PROJECT}/bookshelf .
gcloud docker -- push gcr.io/${GCLOUD_PROJECT}/bookshelf

# Create the required K8s clusters
kubectl create -f bookshelf-frontend.yaml
kubectl create -f bookshelf-worker.yaml
kubectl create -f bookshelf-service.yaml

# Run tests
npm run e2e

# Exit on error
if [[ $CODE -ne 0 ]]; then
  exit $CODE
fi