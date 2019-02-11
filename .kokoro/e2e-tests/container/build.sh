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

ZONE=us-central1-a
export NODE_ENV=development
export E2E_TESTS=true # test the deployed app

# Register post-test cleanup
function cleanup {
  CODE=$?

  # Delete the K8s resources
  set +e
  kubectl delete -f bookshelf-frontend-${DATA_BACKEND}.yaml || true
  kubectl delete -f bookshelf-worker-${DATA_BACKEND}.yaml || true
  kubectl delete -f bookshelf-service.yaml || true

  # Wait for service deletion to finalize
  sleep 120;

  # Delete the cluster
  gcloud container clusters delete bookshelf --zone $ZONE -q || true

  gsutil -m cp */*.log gs://nodejs-getting-started-tests-deployment-logs || true

  # Update build badge
  BADGE_URL="gs://nodejs-getting-started-tests-badges"
  if [[ CODE -eq 0 ]]; then
    STATUS="passing"
  else
    STATUS="failing"
  fi
  gsutil cp ${BADGE_URL}/${DATA_BACKEND}-${STATUS}.svg ${BADGE_URL}/${BOOKSHELF_DIRECTORY:0:1}-${DATA_BACKEND}.svg
}
trap cleanup EXIT
set -e;

# Configure gcloud
export GCLOUD_PROJECT=nodejs-getting-started-tests
export GOOGLE_APPLICATION_CREDENTIALS=${KOKORO_GFILE_DIR}/secrets-key.json
gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project $GCLOUD_PROJECT

# Extract secrets
export MYSQL_USER=$(cat ${KOKORO_GFILE_DIR}/secrets-mysql-user.json)
export MYSQL_PASSWORD=$(cat ${KOKORO_GFILE_DIR}/secrets-mysql-password.json)
export MONGO_URL=$(cat ${KOKORO_GFILE_DIR}/secrets-mongo-url.json)
export INSTANCE_CONNECTION_NAME="${GCLOUD_PROJECT}:us-central1:integration-test-instance"


# Load the Node version manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Use Node 8
nvm install 8

# Install Node dependencies
npm install -g @google-cloud/nodejs-repo-tools
cd github/nodejs-getting-started/${BOOKSHELF_DIRECTORY}

# Copy secrets
cp ${KOKORO_GFILE_DIR}/secrets-config.json config.json
cp $GOOGLE_APPLICATION_CREDENTIALS key.json

# Install dependencies (for running the tests, not the apps themselves)
npm install

# Build and deploy Docker images
docker build -t gcr.io/${GCLOUD_PROJECT}/bookshelf .
gcloud docker -- push gcr.io/${GCLOUD_PROJECT}/bookshelf

# Substitute required variables
# Use sed, as @google-cloud/nodejs-repo-tools doesn't support K8s deployments
sed -i.bak "s/\[GCLOUD_PROJECT\]/${GCLOUD_PROJECT}/g" bookshelf-*.yaml
sed -i.bak "s/\[INSTANCE_CONNECTION_NAME\]/${INSTANCE_CONNECTION_NAME}/g" bookshelf-*.yaml

# Create and connect to the required K8s cluster
gcloud container clusters create bookshelf --scopes "cloud-platform" --num-nodes 2 --zone $ZONE
gcloud container clusters get-credentials bookshelf --zone $ZONE

# Create K8s secrets
kubectl create secret generic keyfile --from-file "$GOOGLE_APPLICATION_CREDENTIALS"
kubectl create secret generic cloudsql-db-credentials \
  --from-literal=username="$MYSQL_USER" \
  --from-literal=password="$MYSQL_PASSWORD" \
  --from-literal=instance-connection-name="$INSTANCE_CONNECTION_NAME"
kubectl create secret generic mongodb-credentials --from-literal=mongo-url="$MONGO_URL"

# Create the required K8s services
kubectl create -f bookshelf-frontend-${DATA_BACKEND}.yaml
kubectl create -f bookshelf-worker-${DATA_BACKEND}.yaml
kubectl create -f bookshelf-service.yaml

# Wait for services to initialize
sleep 30;
while kubectl get services | awk '{ print $4 }' | grep "pending"
do
  sleep 30;
done
export TEST_URL=http://$(kubectl get services | awk '{ print $4 }' | grep -E "(\d|\.)+")

# Run (only) the tests that GKE supports
export SKIP_WORKER_HTTP_TESTS=True
npm run e2e

# Exit on error
if [[ $CODE -ne 0 ]]; then
  exit $CODE
fi
