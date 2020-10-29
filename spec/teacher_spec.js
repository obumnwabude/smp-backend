const mongoUnit = require('mongo-unit');
const request = require('supertest');
let app, adminToken, adminId, oldToken, teacherToken, teacherId;

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
        .then(done)
        .catch(done.fail);
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
        .then(done)
        .catch(done.fail);
    });

    it('should not create if adminToken is absent and there is valid adminId', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .send({ adminId: adminId, name: 'o' })
        .expect(403)
        .then(done)
        .catch(done.fail);
    });

    it('should not create if adminToken is invalid and there is valid adminId', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', 'Bearer invalidToken')
        .send({ adminId: adminId, name: 'o' })
        .expect(403)
        .then(done)
        .catch(done.fail);
    });

    it('should not create if request body does not contain valid name', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminId: adminId, name: 'o' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should not create if request body does not contain valid email', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminId: adminId, name: 'teacher1', email: 'teach' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
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
        .then(done)
        .catch(done.fail);
    });

    it('should create teacher and return password', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminId: adminId,
          name: 'teacher1',
          email: 'teach@teach.com',
          phone: '07000000000'
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.password).toBeDefined();

          teacherId = response.body._id;
        })
        .then(done)
        .catch(done.fail);
    });

    it('should reject teacher creation if existing email or phone is used', (done) => {
      request(app)
        .post('/api/v1/teacher')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminId: adminId,
          name: 'teacher1',
          email: 'teach@teach.com',
          phone: '07000000000'
        })
        .expect(422)
        .expect((response) => {
          expect(response.body.success).toBeFalse();
          expect(response.body.message).toMatch(/email/);
          expect(response.body.message).toMatch(/phone/);
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('can login;', () => {
    it('should reject if body is empty', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if invalid email is sent for login', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .send({ email: 'teach' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if no password is provided', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .send({ email: 'teach@teach.com' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if insufficient password is provided', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .send({
          email: 'teach@teach.com',
          password: 'pass'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if wrong password is provided', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .send({
          email: 'teach@teach.com',
          password: 'passwrong'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if inexistent email is sent for login', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .send({ email: 'test0@teach.com', password: 'passwrong' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should login and return token if correct email and password is provided', (done) => {
      request(app)
        .post('/api/v1/teacher/login')
        .send({
          email: 'teach@teach.com',
          password: '00000000'
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.token).toBeDefined();

          teacherToken = response.body.token;
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('uses auth middleware;', () => {
    it('should deny access, if authorization header token in absent', (done) => {
      request(app)
        .get(`/api/v1/teacher/${teacherId}`)
        .expect(403)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should deny access, if authorization header token in invalid', (done) => {
      request(app)
        .get(`/api/v1/teacher/${teacherId}`)
        .set('Authorization', 'Bearer someRandomToken')
        .expect(403)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });
  });

  describe('obtains id from URL for CRUD operations;', () => {
    it('should reject if given an inexistent id in URL parameters', (done) => {
      request(app)
        .get('/api/v1/teacher/someRandomId')
        .expect(400)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if given an invalid id in URL parameters', (done) => {
      request(app)
        .get('/api/v1/teacher/0000000')
        .expect(400)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });
  });

  describe('can be gotten', () => {
    it('should return all details and password should still be default', (done) => {
      request(app)
        .get(`/api/v1/teacher/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.hasDefaultPassword).toBeTrue();
          expect(response.body.email).toBeDefined();
        })
        .then(done)
        .catch(done.fail);
    });
  });

  describe('can change default password', () => {
    it('should reject if body is empty', (done) => {
      request(app)
        .put(`/api/v1/teacher/password/default/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should reject if new password is less than 8 characters', (done) => {
      request(app)
        .put(`/api/v1/teacher/password/default/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ password: 'newer' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should change default password if it has not been changed', (done) => {
      oldToken = teacherToken;
      request(app)
        .put(`/api/v1/teacher/password/default/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ password: 'newerpass' })
        .expect(202)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.hasDefaultPassword).toBeFalse();
          teacherToken = response.body.token;
        })
        .then(done)
        .catch(done.fail);
    });

    it('should invalidate old tokens obtained before default password was changed', (done) => {
      request(app)
        .get(`/api/v1/teacher/${teacherId}`)
        .set('Authorization', `Bearer ${oldToken}`)
        .expect(403)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done)
        .catch(done.fail);
    });

    it('should not permit default password change if it has been changed', (done) => {
      request(app)
        .put(`/api/v1/teacher/password/default/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ password: 'newernewer' })
        .expect(401)
        .expect((response) => {
          expect(response.body.success).toBeFalse();
        })
        .then(done)
        .catch(done.fail);
    });

    it('should recognize that default password has been changed', (done) => {
      request(app)
        .get(`/api/v1/teacher/${teacherId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.hasDefaultPassword).toBeFalse();
        })
        .then(done)
        .catch(done.fail);
    });
  });
});
