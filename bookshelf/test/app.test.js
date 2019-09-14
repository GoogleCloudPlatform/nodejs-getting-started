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
