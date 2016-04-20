// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var gcloud = require('gcloud');
var config = require('../config');
var logging = require('./logging');

var topicName = config.get('TOPIC_NAME');
var subscriptionName = config.get('SUBSCRIPTION_NAME');

var pubsub = gcloud.pubsub({
  projectId: config.get('GCLOUD_PROJECT')
});

// This configuration will automatically create the topic if
// it doesn't yet exist. Usually, you'll want to make sure
// that a least one subscription exists on the topic before
// publishing anything to it as topics without subscribers
// will essentially drop any messages.
// [START topic]
function getTopic (cb) {
  pubsub.createTopic(topicName, function (err, topic) {
    // topic already exists.
    if (err && err.code === 409) {
      return cb(null, pubsub.topic(topicName));
    }
    return cb(err, topic);
  });
}
// [END topic]

// Used by the worker to listen to pubsub messages.
// When more than one worker is running they will all share the same
// subscription, which means that pub/sub will evenly distribute messages
// to each worker.
// [START subscribe]
function subscribe (cb) {
  var subscription;

  // Event handlers
  function handleMessage (message) {
    cb(null, message.data);
  }
  function handleError (err) {
    logging.error(err);
  }

  getTopic(function (err, topic) {
    if (err) {
      return cb(err);
    }

    topic.subscribe(subscriptionName, {
      autoAck: true,
      reuseExisting: true
    }, function (err, sub) {
      if (err) {
        return cb(err);
      }

      subscription = sub;

      // Listen to and handle message and error events
      subscription.on('message', handleMessage);
      subscription.on('error', handleError);

      logging.info('Listening to ' + topicName +
        ' with subscription ' + subscriptionName);
    });
  });

  // Subscription cancellation function
  return function () {
    if (subscription) {
      // Remove event listeners
      subscription.removeListener('message', handleMessage);
      subscription.removeListener('error', handleError);
      subscription = undefined;
    }
  };
}
// [END subscribe]

// Adds a book to the queue to be processed by the worker.
// [START queue]
function queueBook (bookId) {
  getTopic(function (err, topic) {
    if (err) {
      logging.error('Error occurred while getting pubsub topic', err);
      return;
    }

    topic.publish({
      data: {
        action: 'processBook',
        bookId: bookId
      }
    }, function (err) {
      if (err) {
        logging.error('Error occurred while queuing background task', err);
      } else {
        logging.info('Book ' + bookId + ' queued for background processing');
      }
    });
  });
}
// [END queue]

module.exports = {
  subscribe: subscribe,
  queueBook: queueBook
};
