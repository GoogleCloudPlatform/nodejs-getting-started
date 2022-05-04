const app = require('../app');

const request = require('supertest');

describe('GET /', () => {
  it('should get 200', (done) => {
    request(app).get('/').expect(200, done);
  }),
    it('should get Hello None', (done) => {
      request(app).get('/').expect('Hello undefined', done);
    }),
    it('should fail only in continuous and nightly build', (done) => {
      if (
        process.env.BUILD_TYPE === 'continuous' ||
        process.env.BUILD_TYPE === 'nightly'
      ) {
        throw new Error('Intentionally failing in continuous build');
      }
      done();
    });
});
