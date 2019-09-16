const app = require('../app');

const request = require('supertest');

describe('Requests have valid status codes', () => {
  it('should get 302', done => {
    request(app)
      .get('/')
      .expect(302, done);
  }),
    it('should get books', done => {
      request(app)
        .get('/books')
        .expect(200, done);
    });
  it('should get books/add form', done => {
    request(app)
      .get('/books/add')
      .expect(200, done);
  });
});

describe('Should have logs and errors endpoints as described in docs for Stackdriver', () => {
  it('should have logs endpoints', done => {
    request(app)
      .get('/logs')
      .expect(200, done);
  }),
    it('should have errors endpoint', done => {
      request(app)
        .get('/errors')
        .expect(500, done);
    });
});
