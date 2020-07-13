const app = require('../app');

const request = require('supertest');

describe('GET /', () => {
  it('should get 200', done => {
    request(app)
      .get('/')
      .expect(200, done);
  }),
    it('should get Hello None', done => {
      request(app)
        .get('/')
        .expect('Hello undefined', done);
    });
});
