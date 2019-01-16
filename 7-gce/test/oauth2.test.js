// Copyright 2017, Google, Inc.
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

const assert = require('assert');
const sinon = require('sinon');
const request = require('supertest');
const proxyquire = require('proxyquire').noPreserveCache();

const getPassportMock = () => {
  return {
    initialize: sinon.stub().returns((req, res, next) => {
      next();
    }),
    session: sinon.stub().returns((req, res, next) => {
      next();
    }),
    use: sinon.stub(),
    serializeUser: sinon.stub(),
    deserializeUser: sinon.stub(),
    authenticate: sinon.stub().returns((req, res, next) => {
      req.session.oauth2return = '/another/path';
      next();
    }),
  };
};

it('should start authorization', async () => {
  const passportMock = getPassportMock();
  passportMock.authenticate = sinon.stub().returns((req, res) => {
    assert.strictEqual(req.session.oauth2return, '/some/path');
    res.redirect('/auth/google/callback?code=foo');
  });
  const app = proxyquire('../app', {
    passport: passportMock,
    './lib/oauth2': proxyquire('../lib/oauth2', {
      passport: passportMock,
    }),
  });
  await request(app)
    .get('/auth/login?return=%2Fsome%2Fpath')
    .expect(302)
    .expect(response => {
      const text = response.text;
      assert.strictEqual(new RegExp(/Redirecting to \/auth\/google\/callback\?code=foo/).test(text), true);
      assert.strictEqual(passportMock.initialize.calledOnce, true);
      assert.strictEqual(passportMock.session.calledOnce, true);
      assert.strictEqual(passportMock.use.calledOnce, true);
      assert.strictEqual(passportMock.serializeUser.calledOnce, true);
      assert.strictEqual(passportMock.deserializeUser.calledOnce, true);
      assert.strictEqual(passportMock.authenticate.calledTwice, true);
      assert.strictEqual(passportMock.authenticate.firstCall.args[0], 'google');
      assert.deepStrictEqual(passportMock.authenticate.firstCall.args[1], {
        scope: ['email', 'profile'],
      });
      assert.strictEqual(passportMock.authenticate.secondCall.args[0], 'google');
      assert.strictEqual(passportMock.authenticate.secondCall.args[1], undefined);
    });
});

it('should finish authorization', async () => {
  const passportMock = getPassportMock();
  const oauth2 = proxyquire('../lib/oauth2', {
    passport: passportMock,
  });
  const app = proxyquire('../app', {
    passport: passportMock,
    './lib/oauth2': oauth2,
  });
  await request(app)
    .get('/auth/google/callback?code=foo')
    .expect(302)
    .expect(response => {
      const text = response.text;
      assert.strictEqual(new RegExp(/Redirecting to \/another\/path/).test(text), true);
      assert.strictEqual(passportMock.initialize.calledOnce, true);
      assert.strictEqual(passportMock.session.calledOnce, true);
      assert.strictEqual(passportMock.use.calledOnce, true);
      assert.strictEqual(passportMock.serializeUser.calledOnce, true);
      assert.strictEqual(passportMock.deserializeUser.calledOnce, true);
      assert.strictEqual(passportMock.authenticate.calledTwice, true);
      assert.strictEqual(passportMock.authenticate.firstCall.args[0], 'google');
      assert.deepStrictEqual(passportMock.authenticate.firstCall.args[1], {
        scope: ['email', 'profile'],
      });
      assert.strictEqual(passportMock.authenticate.secondCall.args[0], 'google');
      assert.strictEqual(passportMock.authenticate.secondCall.args[1], undefined);
      assert.deepStrictEqual(
        oauth2.extractProfile({
          photos: [{value: 'image.jpg'}],
          id: 1,
          displayName: 'Joe Developer',
        }),
        {
          id: 1,
          displayName: 'Joe Developer',
          image: 'image.jpg',
        }
      );
      const serializeUser = passportMock.serializeUser.firstCall.args[0];
      const deserializeUser = passportMock.deserializeUser.firstCall.args[0];
      const user = {};
      const obj = {};
      serializeUser(user, (err, _user) => {
        assert.strictEqual(err, null);
        assert.strictEqual(_user, user);
      });
      deserializeUser(obj, (err, _obj) => {
        assert.strictEqual(err, null);
        assert.strictEqual(_obj, obj);
      });
    });
});

it('should logout', async () => {
  const passportMock = getPassportMock();
  const app = proxyquire('../app', {
    passport: passportMock,
    './lib/oauth2': proxyquire('../lib/oauth2', {
      passport: passportMock,
    }),
  });
  await request(app)
    .get('/auth/logout')
    .expect(302)
    .expect(response => {
      const text = response.text;
      assert.strictEqual(new RegExp(/Redirecting to \//).test(text), true);
      assert.strictEqual(passportMock.initialize.calledOnce, true);
      assert.strictEqual(passportMock.session.calledOnce, true);
      assert.strictEqual(passportMock.use.calledOnce, true);
      assert.strictEqual(passportMock.serializeUser.calledOnce, true);
      assert.strictEqual(passportMock.deserializeUser.calledOnce, true);
      assert.strictEqual(passportMock.authenticate.calledTwice, true);
      assert.strictEqual(passportMock.authenticate.firstCall.args[0], 'google');
      assert.deepStrictEqual(passportMock.authenticate.firstCall.args[1], {
        scope: ['email', 'profile'],
      });
      assert.strictEqual(passportMock.authenticate.secondCall.args[0], 'google');
      assert.strictEqual(passportMock.authenticate.secondCall.args[1], undefined);
    });
});

it('should require authentication', () => {
  const passportMock = getPassportMock();
  const oauth2 = proxyquire('../lib/oauth2', {
    passport: passportMock,
  });
  const req = {
    originalUrl: '/some/path',
    user: {},
    session: {},
  };
  const res = {
    redirect: sinon.stub(),
  };
  const next = sinon.stub();
  oauth2.required(req, res, next);
  assert.strictEqual(next.calledOnce, true);

  req.user = undefined;
  oauth2.required(req, res, next);
  assert.strictEqual(next.calledOnce, true);
  assert.strictEqual(req.session.oauth2return, req.originalUrl);
  assert.strictEqual(res.redirect.calledOnce, true);
  assert.strictEqual(res.redirect.firstCall.args[0], '/auth/login');
});

it('should add template variables', () => {
  const passportMock = getPassportMock();
  const oauth2 = proxyquire('../lib/oauth2', {
    passport: passportMock,
  });
  const req = {
    originalUrl: '/some/path',
    user: {
      id: 1,
      displayName: 'Joe Developer',
      image: 'image.jpg',
    },
  };
  const res = {
    locals: {},
  };
  const next = sinon.stub();
  oauth2.template(req, res, next);
  assert.strictEqual(next.calledOnce, true);
  assert.strictEqual(res.locals.profile, req.user);
  assert.strictEqual(
    res.locals.login,
    `/auth/login?return=${encodeURIComponent(req.originalUrl)}`
  );
  assert.strictEqual(
    res.locals.logout,
    `/auth/logout?return=${encodeURIComponent(req.originalUrl)}`
  );
});
