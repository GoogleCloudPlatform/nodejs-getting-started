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
  console.log(req.session.id);
  if (!req.session.views) {
    req.session.views = 0;
    req.session.color = colors[Math.floor(Math.random() * 5)];
  }
  const views = req.session.views++;
  res.send(`<body bgcolor=${req.session.color}>Views ${views}</body>`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
