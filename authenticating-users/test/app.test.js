const app = require('../app');
const assert = require('assert');
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

  it('should fail to test that buildcop opens an issue', () => {
    console.log(
      'Hopefully buildcop opens an issue for this on the nightly release'
    );
    assert.strictEqual(true, false);
  });
});
