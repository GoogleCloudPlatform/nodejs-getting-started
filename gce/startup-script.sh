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

# [START startup]
# Talk to the metadata server to get the project id
PROJECTID=$(curl -s "http://metadata.google.internal/computeMetadata/v1/project/project-id" -H "Metadata-Flavor: Google")

# Install logging monitor and configure it to pickup application logs
# [START logging]
curl -s "https://storage.googleapis.com/signals-agents/logging/google-fluentd-install.sh" | bash

cat >/etc/google-fluentd/config.d/nodeapp.conf << EOF
<source>
  type tail
  format json
  path /opt/app/request.log
  pos_file /var/tmp/fluentd.nodeapp-request.pos
  tag nodeapp-request
</source>

<source>
  type tail
  format json
  path /opt/app/error.log
  pos_file /var/tmp/fluentd.nodeapp-error.pos
  tag nodeapp-error
</source>

<source>
  type tail
  format json
  path /opt/app/general.log
  pos_file /var/tmp/fluentd.nodeapp-general.pos
  tag nodeapp-general
</source>
EOF

service google-fluentd restart &
# [END logging]

# Add nodejs repository (NodeSource)
curl -sL https://deb.nodesource.com/setup | bash -

# Install dependencies from apt
apt-get install -y git nodejs build-essential supervisor

# Get the source code
git config --global credential.helper gcloud.sh
git clone https://source.developers.google.com/p/$PROJECTID /opt/app

# Install app dependencies
cd /opt/app
npm install

# Create a nodeapp user. The application will run as this user.
useradd -m -d /home/nodeapp nodeapp
chown -R nodeapp:nodeapp /opt/app

# Configure supervisor to run the node app.
cat >/etc/supervisor/conf.d/node-app.conf << EOF
[program:nodeapp]
directory=/opt/app
command=npm start
autostart=true
autorestart=true
user=nodeapp
environment=HOME="/home/nodeapp",USER="nodeapp",NODE_ENV="production"
EOF

supervisorctl reread
supervisorctl update

# Application should now be running under supervisor
# [END startup]
