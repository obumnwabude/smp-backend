const mongoUnit = require('mongo-unit');
const request = require('supertest');
let app, adminToken, adminId;

describe('Teacher', () => {
  beforeAll((done) => {
    mongoUnit.start().then((testMongoUrl) => {
      process.env.MONGODB_URL = testMongoUrl;
      process.env.PORT = 3002;
      process.env.NO_LOGS = true;
      app = require('../index');

      // create admin to be used across all specs
      request(app)
        .post('/api/v1/admin')
        .send({
          name: 'test',
          email: 'test@test.com',
          phone: '07000100000',
          password: 'passpasspa'
        })
        .then((response) => {
          adminId = response.body._id;

          // login admin to get token for use in tests
          request(app)
            .post('/api/v1/admin/login')
            .send({
              email: 'test@test.com',
              password: 'passpasspa'
            })
            .then((response) => {
              adminToken = response.body.token;
              done();
            });
        });
    });
  });

  afterAll(async (done) => {
    await mongoUnit.drop();
    await app.close();
    done();
  });

  describe('can be created', () => {
    it('should not create if adminId in the request body absent', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .send({ name: 'o' })
        .expect(400)
        .expect((response) => {
          expect(response.body.success).toBeFalse();
          expect(response.body.message).toMatch(/admin/);
        })
        .then(done);
    });

    it('should not create if adminId in the request body absent', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .send({ adminId: 'invalidId', name: 'o' })
        .expect(400)
        .expect((response) => {
          expect(response.body.success).toBeFalse();
          expect(response.body.message).toMatch(/admin/);
        })
        .then(done);
    });

    it('should not create if adminToken is absent and there is valid adminId', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .send({ adminId: adminId, name: 'o' })
        .expect(403)
        .then(done);
    });

    it('should not create if adminToken is invalid and there is valid adminId', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer invalidToken`)
        .send({ adminId: adminId, name: 'o' })
        .expect(403)
        .then(done);
    });

    it('should not create if request body does not contain valid name', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminId: adminId, name: 'o' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should not create if request body does not contain valid email', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminId: adminId, name: 'teacher1', email: 'teach' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should not create if request body does not contain valid phone', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminId: adminId,
          name: 'teacher1',
          email: 'teach@teach.com',
          phone: '0700'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should create teacher and return password', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminId: adminId,
          name: 'teacher1',
          email: 'teach.obu-oasdf@teach.com',
          phone: '07000000000'
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.password).toBeDefined();
        })
        .then(done);
    });
  });
});
