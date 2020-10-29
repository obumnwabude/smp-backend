const mongoUnit = require('mongo-unit');
const request = require('supertest');
let app;

describe('Server', () => {
  beforeAll((done) => {
    mongoUnit.start().then((testMongoUrl) => {
      process.env.MONGODB_URL = testMongoUrl;
      process.env.PORT = 3002;
      process.env.NO_LOGS = true;
      app = require('../index');
      done();
    });
  });

  afterAll(async (done) => {
    await mongoUnit.drop();
    await app.close();
    done();
  });

  it('should have /404', (done) => {
    request(app).get('/404').expect(404).then(done).catch(done.fail);
  });
});
