const app = require('../index');

const request = require('supertest');

describe('Requests have valid status codes', () => {
  it('should get 200', done => {
    request(app)
      .get('/')
      .expect(200, done);
  });
});
