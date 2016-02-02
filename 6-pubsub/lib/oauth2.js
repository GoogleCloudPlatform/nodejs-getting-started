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


// OpenID Connect (OAuth2 for Login).
//
// This allows users that have Google accounts (or Google for Work accounts) to
// log in to the application.
// [Read more about OpenID Connect](
// https://developers.google.com/accounts/docs/OpenIDConnect)
//
// It performs the [OAuth2 Web Server Flow](
// https://developers.google.com/accounts/docs/OAuth2WebServer)
// and makes the user's credentials and profile information available via the
// session.
//
// Basic usage:
//
//     var oauth2 = require('oauth2')({
//       clientId: 'your-client-id',
//       clientSecret: 'your-client-secret',
//       redirectUrl: 'http://your-redirect-url',
//       scopes: ['email', 'profile']
//     });
//
//     app.use(oauth2.router);
//
//     app.get('/users_only', oauth2.required, function(req, res){
//       // only logged-in users can access.
//       // other users are redirected to the login page.
//     });
//
//     app.get('/aware', oauth2.aware, function(req, res){
//       if(req.oauth2client) // user is logged in.
//     });


var crypto = require('crypto');
var googleapis = require('googleapis');
var express = require('express');


module.exports = function(config) {

  var router = express.Router();


  // The state token is used by the authorization flow
  // to prevent request forgery attacks.
  function generateStateToken() {
    return crypto.randomBytes(16).toString('hex');
  }


  // Generates a OAuth2 client based on the current configuration.
  // This client is ready to be loaded with credentials and used.
  function getClient() {
    return new googleapis.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUrl
    );
  }


  // Makes a call to the Google+ API to retrieve the user's basic
  // profile info. An authorized OAuth2 client is required.
  function getUserProfile(client, cb) {
    var plus = googleapis.plus('v1');
    plus.people.get({
      userId: 'me',
      auth: client
    }, cb);
  }


  // Middleware that makes the user's credentials available
  // in the request as ``req.oauth2client``. If no credentials
  // are available, then ``req.oauth2client`` will be undefined.
  //
  // If the credentials are updated by the client (i.e., the access
  // token expires and is refreshed) then this middleware will
  // store the new credentials in the session.
  function authAware(req, res, next) {
    if (req.session.oauth2tokens) {
      req.oauth2client = getClient();
      req.oauth2client.setCredentials(req.session.oauth2tokens);
    }

    next();

    // Save credentials back to the session as they may have been
    // refreshed by the client.
    if (req.oauth2client) {
      req.session.oauth2tokens = req.oauth2client.credentials;
    }
  }


  // Middleware that requires the user to be logged in. If the
  // user is not logged in, it will redirect the user to authorize
  // the application and then return them to the original URL they
  // requested.
  function authRequired(req, res, next) {
    authAware(req, res, function() {
      if (!req.oauth2client) {
        req.session.oauth2return = req.originalUrl;
        return res.redirect('/oauth2/authorize');
      }
      next();
    });
  }


  // Middleware that exposes the user's profile as well as login/
  // logout URLs to any templates. These are available as `profile`,
  // `login`, and `logout`.
  function addTemplateVariables(req, res, next) {
    res.locals.profile = req.session.profile;
    res.locals.login = '/oauth2/authorize?return=' +
      encodeURIComponent(req.originalUrl);
    res.locals.logout = '/oauth2/logout?return=' +
      encodeURIComponent(req.originalUrl);
    next();
  }


  // Begins the authorization flow. The user will be redirected to Google
  // where they can authorize the application to have access to their
  // basic profile information. Upon approval the user is redirected
  // to `/oauth2callback`. If the `return` query parameter is specified
  // when sending a user to this URL then they will be redirected to that
  // URL when the flow is finished.
  router.get('/oauth2/authorize', function(req, res) {
    /* jshint camelcase: false */
    var stateToken = generateStateToken();
    var authorizeUrl = getClient().generateAuthUrl({
      access_type: 'offline',
      scope: config.scopes || ['email', 'profile'],
      state: stateToken
    });
    req.session.oauth2statetoken = stateToken;
    if (req.query.return) { req.session.oauth2return = req.query.return; }
    res.redirect(authorizeUrl);
  });


  // Completes the authorization flow. When the user approves application
  // access at Google's authorization page, Google returns the user to this
  // URL. This handler will obtain the user's credentials (access and refresh
  // tokens), save the credentials and user's profile information to the session
  // and then redirect the user to the `return` URL specified to
  // `/oauth2/authorize`.
  router.get('/oauth2callback', function(req, res) {
    if (!req.query.code || req.query.state !== req.session.oauth2statetoken) {
      return res.status(400).send('Invalid auth code or state token.');
    }
    getClient().getToken(req.query.code, function(err, tokens) {
      if (err) { return res.status(400).send(err.message); }
      req.session.oauth2tokens = tokens;

      /* Get the user's info and store it in the session */
      var client = getClient();
      client.setCredentials(tokens);
      getUserProfile(client, function(err, profile) {
        if (err) { return res.status('500').send(err.message); }
        req.session.profile = {
          id: profile.id,
          displayName: profile.displayName,
          name: profile.name,
          image: profile.image
        };
        res.redirect(req.session.oauth2return || '/');
      });
    });
  });


  // Deletes the user's credentials and profile from the session.
  // This does not revoke any active tokens.
  router.get('/oauth2/logout', function(req, res) {
    delete req.session.oauth2tokens;
    delete req.session.profile;
    res.redirect(req.query.return || req.session.oauth2return || '/');
  });


  return {
    router: router,
    aware: authAware,
    required: authRequired,
    template: addTemplateVariables
  };
};
