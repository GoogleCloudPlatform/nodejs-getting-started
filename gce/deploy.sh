#	Copyright 2015, Google, Inc. 
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
#! /bin/bash

set -ex

ZONE=us-central1-f

GROUP=frontend-group
TEMPLATE=$GROUP-tmpl
MACHINE_TYPE=f1-micro
STARTUP_SCRIPT=startup-script.sh
SCOPES="logging-write \
storage-rw \
https://www.googleapis.com/auth/projecthosting \
https://www.googleapis.com/auth/cloud-platform \
https://www.googleapis.com/auth/userinfo.email"
TAGS=http-server

MIN_INSTANCES=1
MAX_INSTANCES=10
TARGET_UTILIZATION=0.6

SERVICE=frontend-web-service
AUTOSCALER=frontend-web-autoscaler

#
# Instance group setup
#

# First we have to create an instance template.
# This template will be used by the instance group
# to create new instances.

gcloud compute instance-templates create $TEMPLATE \
  --machine-type $MACHINE_TYPE \
  --scopes $SCOPES \
  --metadata-from-file startup-script=$STARTUP_SCRIPT \
  --tags $TAGS

# Create the managed instance group.

gcloud preview managed-instance-groups \
  --zone $ZONE \
  create $GROUP \
  --base-instance-name $GROUP \
  --size $MIN_INSTANCES \
  --template $TEMPLATE

#
# Load Balancer Setup
#

# A complete HTTP load balancer is structured as follows:
#
# 1) A global forwarding rule directs incoming requests to a target HTTP proxy.
# 2) The target HTTP proxy checks each request against a URL map to determine the
#    appropriate backend service for the request.
# 3) The backend service directs each request to an appropriate backend based on
#    serving capacity, zone, and instance health of its attached backends. The
#    health of each backend instance is verified using either a health check.
#
# We'll create these resources in reverse order:
# service, health check, backend service, url map, proxy.

# Define a service for our instance group.
# The load balancer uses services to direct traffic to specific ports on our instances.
gcloud preview instance-groups \
  --zone $ZONE \
  add-service $GROUP \
  --port 8080 \
  --service http

# Create a health check
# The load balancer will use this check to keep track of which instances to send traffic to.
# Note that health checks will not cause the load balancer to shutdown any instances.
gcloud compute http-health-checks create ah-health-check \
  --request-path /_ah/health

# Create a backend service, associate it with the health check and instance group.
# The backend service serves as a target for load balancing.
gcloud compute backend-services create $SERVICE \
  --http-health-check ah-health-check

gcloud compute backend-services add-backend $SERVICE \
  --group $GROUP \
  --zone $ZONE

# Create a URL map and web Proxy. The URL map will send all requests to the
# backend service defined above.
gcloud compute url-maps create $SERVICE-map \
  --default-service $SERVICE

gcloud compute target-http-proxies create $SERVICE-proxy \
  --url-map $SERVICE-map

# Create a global forwarding rule to send all traffic to our proxy
gcloud compute forwarding-rules create $SERVICE-http-rule \
  --global \
  --target-http-proxy $SERVICE-proxy \
  --port-range 80

#
# Autoscaler configuration
#

gcloud preview autoscaler \
  --zone $ZONE \
  create $AUTOSCALER \
  --max-num-replicas $MAX_INSTANCES \
  --target-load-balancer-utilization $TARGET_UTILIZATION \
  --target $GROUP
