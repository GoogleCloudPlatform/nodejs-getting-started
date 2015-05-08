/*
	Copyright 2015, Google, Inc. 
 Licensed under the Apache License, Version 2.0 (the "License"); 
 you may not use this file except in compliance with the License. 
 You may obtain a copy of the License at 
  
    http://www.apache.org/licenses/LICENSE-2.0 
  
 Unless required by applicable law or agreed to in writing, software 
 distributed under the License is distributed on an "AS IS" BASIS, 
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 See the License for the specific language governing permissions and 
 limitations under the License.
*/
/*

Lifecycle events.

When running on Google App Engine Managed VMs, the application will receive
start, stop, and health check requests. [Read more](https://cloud.google.com/appengine/docs/managed-vms/custom-runtimes#lifecycle_events)

If running on Compute Engine, the HTTP load balancer can also take advantage of the health
check. [Read more](https://cloud.google.com/compute/docs/load-balancing/health-checks).

*/

"use strict";

var express = require('express');

var router = express.Router();


// [START health_checks]
router.get('/_ah/health', function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('ok');
});
// [END health_checks]


router.get('/_ah/start', function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('ok');
});


router.get('/_ah/stop', function(req, res) {
  res.set('Content-Type', 'text/plain');
  res.status(200).send('ok');
  process.exit();
});


module.exports = router;
