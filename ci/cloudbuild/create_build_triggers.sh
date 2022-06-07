#!/bin/bash
#
# Copyright 2022 Google LLC
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

# A script for creating Cloud Build build triggers.

# `-e` enables the script to automatically fail when a command fails
# `-o pipefail` sets the exit code to the rightmost comment to exit
# with a non-zero
set -eo pipefail

REPO_OWNER="GoogleCloudPlatform"
REPO_NAME="nodejs-getting-started"

NODE_VERSIONS=(
    "14"
)

for NODE_VERSION in ${NODE_VERSIONS[@]}; do
    # Creating presubmit build
    gcloud beta builds triggers create github \
	   --name=gcb-presubmit-node${NODE_VERSION} \
	   --service-account="projects/firestore-nodejs-getting-start/serviceAccounts/firestore-nodejs-getting-start@firestore-nodejs-getting-start.iam.gserviceaccount.com" \
	   --description="Presubmit build with node ${NODE_VERSION}" \
	   --repo-name="${REPO_NAME}" \
	   --repo-owner="${REPO_OWNER}" \
	   --pull-request-pattern="^main$" \
	   --build-config="ci/cloudbuild/cloudbuild.yaml" \
	   --substitutions="_BUILD_TYPE=presubmit,_LOGS_BUCKET=nodejs-samples-publiclogs,_NODE_VERSION=${NODE_VERSION},_IMAGE_PREFIX=nodejs-getting-started-test-node,_REPO_OWNER=GoogleCloudPlatform" \
	   --comment-control="COMMENTS_ENABLED_FOR_EXTERNAL_CONTRIBUTORS_ONLY" \
	   --include-logs-with-status


    # Creating continuous build
    gcloud beta builds triggers create github \
	   --name=gcb-continuous-node${NODE_VERSION} \
	   --service-account="projects/firestore-nodejs-getting-start/serviceAccounts/firestore-nodejs-getting-start@firestore-nodejs-getting-start.iam.gserviceaccount.com" \
	   --description="Continuous build with node ${NODE_VERSION}" \
	   --repo-name="${REPO_NAME}" \
	   --repo-owner="${REPO_OWNER}" \
	   --branch-pattern="^main$" \
	   --build-config="ci/cloudbuild/cloudbuild.yaml" \
	   --substitutions="_BUILD_TYPE=continuous,_LOGS_BUCKET=nodejs-samples-publiclogs,_NODE_VERSION=${NODE_VERSION},_IMAGE_PREFIX=nodejs-getting-started-test-node,_REPO_OWNER=GoogleCloudPlatform"

done
