const request = require('supertest');
const app = require('../app');

describe('GET /', () => {

  it('should return 200 status code', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });

  it('should return correct message', (done) => {
    request(app)
      .get('/')
      .expect('Hello from CI/CD Pipeline!', done);
  });

});