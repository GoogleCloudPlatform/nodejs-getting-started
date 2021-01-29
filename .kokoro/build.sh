#!/bin/bash

# Copyright 2018 Google Inc.
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

export GCLOUD_PROJECT='firestore-nodejs-getting-start'
export REGION_ID='uc'


# Activate mocha config
export MOCHA_REPORTER_OUTPUT=${PROJECT}_sponge_log.xml
export MOCHA_REPORTER=xunit
pushd github/nodejs-getting-started
mv .kokoro/.mocharc.js .
popd

cd github/nodejs-getting-started/${PROJECT}

# Install dependencies
npm install

# Configure gcloud
export GOOGLE_APPLICATION_CREDENTIALS=${KOKORO_GFILE_DIR}/secret_manager/nodejs-getting-started-tests-firestore_service-account
gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project $GCLOUD_PROJECT

if [[ $KOKORO_BUILD_ARTIFACTS_SUBDIR = *"release"* ]]; then
	export MOCHA_REPORTER_SUITENAME=${PROJECT}
	cleanup() {
	chmod +x $KOKORO_GFILE_DIR/linux_amd64/flakybot
	$KOKORO_GFILE_DIR/linux_amd64/flakybot
	}
	trap cleanup EXIT HUP
fi

npm test

exit $?
