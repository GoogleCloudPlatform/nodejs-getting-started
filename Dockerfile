# Copyright 2015, Google, Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# [START docker]
# This Dockerfile is optional and was generated using:
#   $ gcloud preview app gen-config .
# The default base image is a Debian-based container with Node.js installed.
# The image will execute "npm start" to run the application. You can customize
# this Dockerfile to modify your application's runtime environment, or you can
# use a different base image entirely.
FROM gcr.io/google_appengine/nodejs

COPY package.json /app/
RUN npm install
COPY . /app/
CMD npm start
# [END docker]
