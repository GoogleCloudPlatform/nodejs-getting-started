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

ARG NODE_VERSION=14

FROM golang:1.18-alpine as build

RUN apk add --no-cache git curl tar python3

RUN git clone https://github.com/googleapis/repo-automation-bots.git && \
    cd repo-automation-bots/packages/flakybot && \
    go build && \
    cp flakybot /bin/flakybot && \
    chmod +x /bin/flakybot

# Install gcloud
RUN curl https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.tar.gz > /tmp/google-cloud-sdk.tar.gz

RUN mkdir -p /usr/local/gcloud \
  && tar -C /usr/local/gcloud -xvf /tmp/google-cloud-sdk.tar.gz \
  && /usr/local/gcloud/google-cloud-sdk/install.sh

FROM node:${NODE_VERSION}-alpine

COPY --from=build /bin/flakybot /bin/flakybot
COPY --from=build /usr/local/gcloud /usr/local/gcloud
RUN apk add --no-cache git bash python3

ENV PATH $PATH:/usr/local/gcloud/google-cloud-sdk/bin
