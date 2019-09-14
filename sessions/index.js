// Copyright 2019, Google LLC.
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

const {Firestore} = require('@google-cloud/firestore');
const express = require('express');
const session = require('express-session');

const app = express();
const {FirestoreStore} = require('@google-cloud/connect-firestore');

app.use(
  session({
    store: new FirestoreStore({
      dataset: new Firestore({
        kind: 'express-sessions',
      }),
    }),
    secret: 'my-secret',
    resave: false,
    saveUninitialized: true,
  })
);

const colors = ['red', 'blue', 'green', 'yellow', 'pink'];

app.get('/', (req, res) => {
  if (!req.session.views) {
    req.session.views = 0;
    req.session.color = colors[Math.floor(Math.random() * colors.length)];
  }
  const views = req.session.views++;
  res.send(`<body bgcolor=${req.session.color}>Views ${views}</body>`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

module.exports = app;
