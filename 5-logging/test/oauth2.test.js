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

const test = require(`ava`);
const sinon = require(`sinon`);
const request = require(`supertest`);
const proxyquire = require(`proxyquire`).noPreserveCache();

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
      req.session.oauth2return = `/another/path`;
      next();
    }),
  };
};

test.cb(`should start authorization`, t => {
  const passportMock = getPassportMock();
  passportMock.authenticate = sinon.stub().returns((req, res) => {
    t.is(req.session.oauth2return, `/some/path`);
    res.redirect(`/auth/google/callback?code=foo`);
  });
  const app = proxyquire(`../app`, {
    passport: passportMock,
    './lib/oauth2': proxyquire(`../lib/oauth2`, {
      passport: passportMock,
    }),
  });
  request(app)
    .get(`/auth/login?return=%2Fsome%2Fpath`)
    .expect(302)
    .expect(response => {
      const text = response.text;
      t.regex(text, /Redirecting to \/auth\/google\/callback\?code=foo/);
      t.true(passportMock.initialize.calledOnce);
      t.true(passportMock.session.calledOnce);
      t.true(passportMock.use.calledOnce);
      t.true(passportMock.serializeUser.calledOnce);
      t.true(passportMock.deserializeUser.calledOnce);
      t.true(passportMock.authenticate.calledTwice);
      t.is(passportMock.authenticate.firstCall.args[0], `google`);
      t.deepEqual(passportMock.authenticate.firstCall.args[1], {
        scope: [`email`, `profile`],
      });
      t.is(passportMock.authenticate.secondCall.args[0], `google`);
      t.is(passportMock.authenticate.secondCall.args[1], undefined);
    })
    .end(t.end);
});

test.cb(`should finish authorization`, t => {
  const passportMock = getPassportMock();
  const oauth2 = proxyquire(`../lib/oauth2`, {
    passport: passportMock,
  });
  const app = proxyquire(`../app`, {
    passport: passportMock,
    './lib/oauth2': oauth2,
  });
  request(app)
    .get(`/auth/google/callback?code=foo`)
    .expect(302)
    .expect(response => {
      const text = response.text;
      t.regex(text, /Redirecting to \/another\/path/);
      t.true(passportMock.initialize.calledOnce);
      t.true(passportMock.session.calledOnce);
      t.true(passportMock.use.calledOnce);
      t.true(passportMock.serializeUser.calledOnce);
      t.true(passportMock.deserializeUser.calledOnce);
      t.true(passportMock.authenticate.calledTwice);
      t.is(passportMock.authenticate.firstCall.args[0], `google`);
      t.deepEqual(passportMock.authenticate.firstCall.args[1], {
        scope: [`email`, `profile`],
      });
      t.is(passportMock.authenticate.secondCall.args[0], `google`);
      t.is(passportMock.authenticate.secondCall.args[1], undefined);
      t.deepEqual(
        oauth2.extractProfile({
          photos: [{value: `image.jpg`}],
          id: 1,
          displayName: `Joe Developer`,
        }),
        {
          id: 1,
          displayName: `Joe Developer`,
          image: `image.jpg`,
        }
      );
      const serializeUser = passportMock.serializeUser.firstCall.args[0];
      const deserializeUser = passportMock.deserializeUser.firstCall.args[0];
      const user = {};
      const obj = {};
      serializeUser(user, (err, _user) => {
        t.is(err, null);
        t.is(_user, user);
      });
      deserializeUser(obj, (err, _obj) => {
        t.is(err, null);
        t.is(_obj, obj);
      });
    })
    .end(t.end);
});

test.cb(`should logout`, t => {
  const passportMock = getPassportMock();
  const app = proxyquire(`../app`, {
    passport: passportMock,
    './lib/oauth2': proxyquire(`../lib/oauth2`, {
      passport: passportMock,
    }),
  });
  request(app)
    .get(`/auth/logout`)
    .expect(302)
    .expect(response => {
      const text = response.text;
      t.regex(text, /Redirecting to \//);
      t.true(passportMock.initialize.calledOnce);
      t.true(passportMock.session.calledOnce);
      t.true(passportMock.use.calledOnce);
      t.true(passportMock.serializeUser.calledOnce);
      t.true(passportMock.deserializeUser.calledOnce);
      t.true(passportMock.authenticate.calledTwice);
      t.is(passportMock.authenticate.firstCall.args[0], `google`);
      t.deepEqual(passportMock.authenticate.firstCall.args[1], {
        scope: [`email`, `profile`],
      });
      t.is(passportMock.authenticate.secondCall.args[0], `google`);
      t.is(passportMock.authenticate.secondCall.args[1], undefined);
    })
    .end(t.end);
});

test(`should require authentication`, t => {
  const passportMock = getPassportMock();
  const oauth2 = proxyquire(`../lib/oauth2`, {
    passport: passportMock,
  });
  const req = {
    originalUrl: `/some/path`,
    user: {},
    session: {},
  };
  const res = {
    redirect: sinon.stub(),
  };
  const next = sinon.stub();
  oauth2.required(req, res, next);
  t.true(next.calledOnce);

  req.user = undefined;
  oauth2.required(req, res, next);
  t.true(next.calledOnce);
  t.is(req.session.oauth2return, req.originalUrl);
  t.true(res.redirect.calledOnce);
  t.is(res.redirect.firstCall.args[0], `/auth/login`);
});

test(`should add template variables`, t => {
  const passportMock = getPassportMock();
  const oauth2 = proxyquire(`../lib/oauth2`, {
    passport: passportMock,
  });
  const req = {
    originalUrl: `/some/path`,
    user: {
      id: 1,
      displayName: `Joe Developer`,
      image: `image.jpg`,
    },
  };
  const res = {
    locals: {},
  };
  const next = sinon.stub();
  oauth2.template(req, res, next);
  t.true(next.calledOnce);
  t.is(res.locals.profile, req.user);
  t.is(
    res.locals.login,
    `/auth/login?return=${encodeURIComponent(req.originalUrl)}`
  );
  t.is(
    res.locals.logout,
    `/auth/logout?return=${encodeURIComponent(req.originalUrl)}`
  );
});
