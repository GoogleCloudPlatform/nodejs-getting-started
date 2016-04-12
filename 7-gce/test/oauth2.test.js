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
var request = require('supertest');
var proxyquire = require('proxyquire').noPreserveCache();

describe('oauth2.js', function () {
  var passportMock;

  beforeEach(function () {
    passportMock = {
      initialize: sinon.stub().returns(function (req, res, next) {
        next();
      }),
      session: sinon.stub().returns(function (req, res, next) {
        next();
      }),
      use: sinon.stub(),
      serializeUser: sinon.stub(),
      deserializeUser: sinon.stub(),
      authenticate: sinon.stub().returns(function (req, res, next) {
        req.session.oauth2return = '/another/path';
        next();
      })
    };
  });

  it('should start authorization', function (done) {
    passportMock.authenticate = sinon.stub().returns(function (req, res, next) {
      assert.equal(req.session.oauth2return, '/some/path');
      res.redirect('/auth/google/callback?code=foo');
    });
    var app = proxyquire('../app', {
      passport: passportMock,
      './lib/oauth2': proxyquire('../lib/oauth2', {
        passport: passportMock
      })
    });
    request(app)
      .get('/auth/login?return=%2Fsome%2Fpath')
      .expect(302)
      .expect(function (response) {
        var text = response.text;
        assert.notEqual(
          text.indexOf('Redirecting to /auth/google/callback?code=foo'),
          -1
        );
        assert(passportMock.initialize.calledOnce);
        assert(passportMock.session.calledOnce);
        assert(passportMock.use.calledOnce);
        assert(passportMock.serializeUser.calledOnce);
        assert(passportMock.deserializeUser.calledOnce);
        assert(passportMock.authenticate.calledTwice);
        assert.equal(passportMock.authenticate.firstCall.args[0], 'google');
        assert.deepEqual(
          passportMock.authenticate.firstCall.args[1],
          { scope: ['email', 'profile'] }
        );
        assert.equal(passportMock.authenticate.secondCall.args[0], 'google');
        assert.equal(passportMock.authenticate.secondCall.args[1], undefined);
      })
      .end(done);
  });

  it('should finish authorization', function (done) {
    var oauth2 = proxyquire('../lib/oauth2', {
      passport: passportMock
    });
    var app = proxyquire('../app', {
      passport: passportMock,
      './lib/oauth2': oauth2
    });
    request(app)
      .get('/auth/google/callback?code=foo')
      .expect(302)
      .expect(function (response) {
        var text = response.text;
        assert.notEqual(
          text.indexOf('Redirecting to /another/path'),
          -1
        );
        assert(passportMock.initialize.calledOnce);
        assert(passportMock.session.calledOnce);
        assert(passportMock.use.calledOnce);
        assert(passportMock.serializeUser.calledOnce);
        assert(passportMock.deserializeUser.calledOnce);
        assert(passportMock.authenticate.calledTwice);
        assert.equal(passportMock.authenticate.firstCall.args[0], 'google');
        assert.deepEqual(
          passportMock.authenticate.firstCall.args[1],
          { scope: ['email', 'profile'] }
        );
        assert.equal(passportMock.authenticate.secondCall.args[0], 'google');
        assert.equal(passportMock.authenticate.secondCall.args[1], undefined);
        assert.deepEqual(
          oauth2.extractProfile({
            photos: [{ value: 'image.jpg' }],
            id: 1,
            displayName: 'Joe Developer'
          }),
          {
            id: 1,
            displayName: 'Joe Developer',
            image: 'image.jpg'
          }
        );
        var serializeUser = passportMock.serializeUser.firstCall.args[0];
        var deserializeUser = passportMock.deserializeUser.firstCall.args[0];
        var user = {};
        var obj = {};
        serializeUser(user, function (err, _user) {
          assert.equal(err, null);
          assert.strictEqual(_user, user);
        });
        deserializeUser(obj, function (err, _obj) {
          assert.equal(err, null);
          assert.strictEqual(_obj, obj);
        });
      })
      .end(done);
  });

  it('should logout', function (done) {
    var app = proxyquire('../app', {
      passport: passportMock,
      './lib/oauth2': proxyquire('../lib/oauth2', {
        passport: passportMock
      })
    });
    request(app)
      .get('/auth/logout')
      .expect(302)
      .expect(function (response) {
        var text = response.text;
        assert.notEqual(
          text.indexOf('Redirecting to /'),
          -1
        );
        assert(passportMock.initialize.calledOnce);
        assert(passportMock.session.calledOnce);
        assert(passportMock.use.calledOnce);
        assert(passportMock.serializeUser.calledOnce);
        assert(passportMock.deserializeUser.calledOnce);
        assert(passportMock.authenticate.calledTwice);
        assert.equal(passportMock.authenticate.firstCall.args[0], 'google');
        assert.deepEqual(
          passportMock.authenticate.firstCall.args[1],
          { scope: ['email', 'profile'] }
        );
        assert.equal(passportMock.authenticate.secondCall.args[0], 'google');
        assert.equal(passportMock.authenticate.secondCall.args[1], undefined);
      })
      .end(done);
  });

  it('should require authentication', function () {
    var oauth2 = proxyquire('../lib/oauth2', {
      passport: passportMock
    });
    var req = {
      originalUrl: '/some/path',
      user: {},
      session: {}
    };
    var res = {
      redirect: sinon.stub()
    };
    var next = sinon.stub();
    oauth2.required(req, res, next);
    assert(next.calledOnce);

    req.user = undefined;
    oauth2.required(req, res, next);
    assert(next.calledOnce);
    assert.equal(req.session.oauth2return, req.originalUrl);
    assert(res.redirect.calledOnce);
    assert.equal(res.redirect.firstCall.args[0], '/auth/login');
  });

  it('should add template variables', function () {
    var oauth2 = proxyquire('../lib/oauth2', {
      passport: passportMock
    });
    var req = {
      originalUrl: '/some/path',
      user: {
        id: 1,
        displayName: 'Joe Developer',
        image: 'image.jpg'
      }
    };
    var res = {
      locals: {}
    };
    var next = sinon.stub();
    oauth2.template(req, res, next);
    assert(next.calledOnce);
    assert.strictEqual(res.locals.profile, req.user);
    assert.equal(
      res.locals.login,
      '/auth/login?return=' + encodeURIComponent(req.originalUrl)
    );
    assert.equal(
      res.locals.logout,
      '/auth/logout?return=' + encodeURIComponent(req.originalUrl)
    );
  });
});
