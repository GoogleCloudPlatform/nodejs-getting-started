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

var assert = require('assert');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache();
var background;
var mocks = {};

describe('background.js', function () {
  beforeEach(function () {
    // Mock dependencies used by background.js
    mocks.config = {
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
      SUBSCRIPTION_NAME: 'shared-worker-subscription',
      TOPIC_NAME: 'book-process-queue'
    };
    mocks.config.get = function (key) {
      return this[key];
    };
    mocks.subscription = {
      on: sinon.stub()
    };
    mocks.topic = {
      subscribe: sinon.stub().callsArgWith(2, null, mocks.subscription),
      publish: sinon.stub().callsArg(1)
    };
    mocks.pubsub = {
      createTopic: sinon.stub().callsArgWith(1, null, mocks.topic),
      topic: sinon.stub().returns(mocks.topic)
    };
    mocks.gcloud = {
      pubsub: sinon.stub().returns(mocks.pubsub)
    };
    mocks.logging = {
      info: sinon.stub(),
      error: sinon.stub()
    };
    // Load background.js with provided mocks
    background = proxyquire('../lib/background', {
      gcloud: mocks.gcloud,
      '../config': mocks.config,
      './logging': mocks.logging
    });

    assert.ok(
      mocks.gcloud.pubsub.calledOnce,
      'gcloud.pubsub() should have been called once'
    );
  });

  describe('subscribe()', function () {
    it('should subscribe and log message', function (done) {
      // Setup
      var testMessage = 'test message';

      // Run target functionality
      background.subscribe(function (err, message) {
        // Assertions
        assert.ok(
          err === null,
          'err should be null'
        );
        assert.equal(message, testMessage, 'should have message');
        assert.ok(
          mocks.pubsub.createTopic,
          'pubsub.createTopic() should have been called once'
        );
        assert.equal(
          mocks.pubsub.createTopic.firstCall.args[0],
          'book-process-queue',
          'pubsub.createTopic() should have been called with the right args'
        );
        assert.equal(
          mocks.pubsub.topic.callCount,
          0,
          'pubsub.topic() should NOT have been called'
        );
        assert.ok(
          mocks.topic.subscribe.calledOnce,
          'topic.subscribe should have been called once'
        );
        assert.equal(
          mocks.topic.subscribe.firstCall.args[0],
          'shared-worker-subscription',
          'topic.subscribe() should have been called with the right arguments'
        );
        assert.deepEqual(
          mocks.topic.subscribe.firstCall.args[1],
          {
            autoAck: true,
            reuseExisting: true
          },
          'topic.subscribe() should have been called with the right arguments'
        );
        assert.ok(
          mocks.subscription.on.calledTwice,
          'subscription.on should have been called twice'
        );
        assert.equal(
          mocks.subscription.on.firstCall.args[0],
          'message',
          'subscription.on() should have been called with the right arguments'
        );
        assert.ok(
          typeof mocks.subscription.on.firstCall.args[1] === 'function',
          'subscription.on() should have been called with the right arguments'
        );
        assert.equal(
          mocks.subscription.on.secondCall.args[0],
          'error',
          'subscription.on() should have been called with the right arguments'
        );
        assert.ok(
          typeof mocks.subscription.on.secondCall.args[1] === 'function',
          'subscription.on() should have been called with the right arguments'
        );
        done();
      });

      // Trigger a message
      setTimeout(function () {
        mocks.subscription.on.firstCall.args[1]({
          data: testMessage
        });
      }, 10);
    });
    it('should return topic error, if any', function (done) {
      // Setup
      var testErrorMsg = 'test error';
      mocks.pubsub.createTopic = sinon.stub().callsArgWith(1, testErrorMsg);

      // Run target functionality
      background.subscribe(function (data) {
        // Assertions
        assert.ok(
          mocks.pubsub.createTopic,
          'pubsub.createTopic() should have been called once'
        );
        assert.equal(
          mocks.pubsub.createTopic.firstCall.args[0],
          'book-process-queue',
          'pubsub.createTopic() should have been called with the right args'
        );
        assert.equal(
          mocks.pubsub.topic.callCount,
          0,
          'pubsub.topic() should NOT have been called'
        );
        assert.equal(data, testErrorMsg);
        assert.equal(
          mocks.topic.subscribe.callCount,
          0,
          'topic.subscribe() should NOT have been called'
        );
        assert.equal(
          mocks.subscription.on.callCount,
          0,
          'subscription.on() should NOT have been called'
        );
        done();
      });
    });
    it('should return subscription error, if any', function (done) {
      // Setup
      var testErrorMsg = 'test error';
      mocks.topic.subscribe = sinon.stub().callsArgWith(2, testErrorMsg);

      // Run target functionality
      background.subscribe(function (data) {
        // Assertions
        assert.ok(
          mocks.pubsub.createTopic,
          'pubsub.createTopic() should have been called once'
        );
        assert.equal(
          mocks.pubsub.createTopic.firstCall.args[0],
          'book-process-queue',
          'pubsub.createTopic() should have been called with the right args'
        );
        assert.equal(
          mocks.pubsub.topic.callCount,
          0,
          'pubsub.topic() should NOT have been called'
        );
        assert.ok(
          mocks.topic.subscribe.calledOnce,
          'topic.subscribe should have been called once'
        );
        assert.equal(
          mocks.topic.subscribe.firstCall.args[0],
          'shared-worker-subscription',
          'topic.subscribe() should have been called with the right arguments'
        );
        assert.deepEqual(
          mocks.topic.subscribe.firstCall.args[1],
          {
            autoAck: true,
            reuseExisting: true
          },
          'topic.subscribe() should have been called with the right arguments'
        );
        assert.equal(data, testErrorMsg);
        assert.equal(
          mocks.subscription.on.callCount,
          0,
          'subscription.on() should NOT have been called'
        );
        assert.equal(
          mocks.logging.info.callCount,
          0,
          'logging.info() should NOT have been called'
        );
        done();
      });
    });
  });

  describe('queueBook()', function () {
    it('should queue a book and log message', function () {
      // Setup
      var testBookId = 1;

      // Run target functionality
      background.queueBook(testBookId);

      // Assertions
      assert.ok(
        mocks.pubsub.createTopic,
        'pubsub.createTopic() should have been called once'
      );
      assert.equal(
        mocks.pubsub.createTopic.firstCall.args[0],
        'book-process-queue',
        'pubsub.createTopic() should have been called with the right arguments'
      );
      assert.equal(
        mocks.pubsub.topic.callCount,
        0,
        'pubsub.topic() should NOT have been called'
      );
      assert.ok(
        mocks.topic.publish,
        'topic.publish() should have been called once'
      );
      assert.deepEqual(
        mocks.topic.publish.firstCall.args[0],
        {
          data: {
            action: 'processBook',
            bookId: testBookId
          }
        },
        'topic.publish() should have been called with the right arguments'
      );
      assert.ok(
        mocks.logging.info.calledOnce,
        'logging.info() should have been called'
      );
      assert.equal(
        mocks.logging.info.firstCall.args[0],
        'Book ' + testBookId + ' queued for background processing',
        'logging.info() should have been called with the right arguments'
      );
    });
    it('should queue a book and log message even if topic exists', function () {
      // Setup
      var testBookId = 1;
      mocks.pubsub.createTopic = sinon.stub().callsArgWith(1, {
        code: 409
      });

      // Run target functionality
      background.queueBook(testBookId);

      // Assertions
      assert.ok(
        mocks.pubsub.createTopic,
        'pubsub.createTopic() should have been called once'
      );
      assert.equal(
        mocks.pubsub.createTopic.firstCall.args[0],
        'book-process-queue',
        'pubsub.createTopic() should have been called with the right arguments'
      );
      assert.ok(
        mocks.pubsub.topic.calledOnce,
        'pubsub.topic() should have been called once'
      );
      assert.equal(
        mocks.pubsub.topic.firstCall.args[0],
        'book-process-queue',
        'pubsub.topic() should have been called with the right arguments'
      );
      assert.ok(
        mocks.topic.publish,
        'topic.publish() should have been called once'
      );
      assert.deepEqual(
        mocks.topic.publish.firstCall.args[0],
        {
          data: {
            action: 'processBook',
            bookId: testBookId
          }
        },
        'topic.publish() should have been called with the right arguments'
      );
      assert.ok(
        mocks.logging.info.calledOnce,
        'logging.info() should have been called'
      );
      assert.equal(
        mocks.logging.info.firstCall.args[0],
        'Book ' + testBookId + ' queued for background processing',
        'logging.info() should have been called with the right arguments'
      );
    });
    it('should log error if cannot get topic', function () {
      // Setup
      var testBookId = 1;
      var testErrorMsg = 'test error';
      mocks.pubsub.createTopic = sinon.stub().callsArgWith(1, testErrorMsg);

      // Run target functionality
      background.queueBook(testBookId);

      // Assertions
      assert.ok(
        mocks.pubsub.createTopic,
        'pubsub.createTopic() should have been called once'
      );
      assert.equal(
        mocks.pubsub.createTopic.firstCall.args[0],
        'book-process-queue',
        'pubsub.createTopic() should have been called with the right arguments'
      );
      assert.equal(
        mocks.pubsub.topic.callCount,
        0,
        'pubsub.topic() should NOT have been called'
      );
      assert.equal(
        mocks.topic.publish.callCount,
        0,
        'topic.publish() should NOT have been called'
      );
      assert.equal(
        mocks.logging.info.callCount,
        0,
        'logging.info() should NOT have been called'
      );
      assert.ok(
        mocks.logging.error.calledOnce,
        'logging.error() should have been called'
      );
      assert.deepEqual(
        mocks.logging.error.firstCall.args,
        ['Error occurred while getting pubsub topic', testErrorMsg],
        'logging.error() should have been called with the right arguments'
      );
    });
    it('should log error if cannot publish message', function () {
      // Setup
      var testBookId = 1;
      var testErrorMsg = 'test error';
      mocks.topic.publish = sinon.stub().callsArgWith(1, testErrorMsg);

      // Run target functionality
      background.queueBook(testBookId);

      // Assertions
      assert.ok(
        mocks.pubsub.createTopic,
        'pubsub.createTopic() should have been called once'
      );
      assert.equal(
        mocks.pubsub.createTopic.firstCall.args[0],
        'book-process-queue',
        'pubsub.createTopic() should have been called with the right arguments'
      );
      assert.equal(
        mocks.pubsub.topic.callCount,
        0,
        'pubsub.topic() should NOT have been called'
      );
      assert.ok(
        mocks.topic.publish,
        'topic.publish() should have been called once'
      );
      assert.deepEqual(
        mocks.topic.publish.firstCall.args[0],
        {
          data: {
            action: 'processBook',
            bookId: testBookId
          }
        },
        'topic.publish() should have been called with the right arguments'
      );
      assert.equal(
        mocks.logging.info.callCount,
        0,
        'logging.info() should NOT have been called'
      );
      assert.ok(
        mocks.logging.error.calledOnce,
        'logging.error() should have been called'
      );
      assert.deepEqual(
        mocks.logging.error.firstCall.args,
        ['Error occurred while queuing background task', testErrorMsg],
        'logging.error() should have been called with the right arguments'
      );
    });
  });
});
