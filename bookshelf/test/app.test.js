// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const app = require('../app');

const request = require('supertest');

describe('Requests have valid status codes', () => {
  it('should get 302', (done) => {
    request(app).get('/').expect(302, done);
  }),
    it('should get books', (done) => {
      request(app).get('/books').expect(200, done);
    });
  it('should get books/add form', (done) => {
    request(app).get('/books/add').expect(200, done);
  });
});

describe('Should have logs and errors endpoints as described in docs for Stackdriver', () => {
  it('should have logs endpoints', (done) => {
    request(app).get('/logs').expect(200, done);
  }),
    it('should have errors endpoint', (done) => {
      request(app).get('/errors').expect(500, done);
    });
});
