const mongoUnit = require('mongo-unit');
const request = require('supertest');
let app, adminToken, adminId;

describe('Admin;', () => {
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

  describe('can be created;', () => {
    it('should reject if body is empty', (done) => {
      request(app)
        .post('/api/v1/admin')
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if invalid name is provided', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({ name: 'o' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if invalid email is provided', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({ name: 'test', email: 'o' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if invalid phone is provided', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({
          name: 'test',
          email: 'test@test.com',
          phone: '0'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if insufficient password is provided', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({
          name: 'test',
          email: 'test@test.com',
          phone: '07000100000',
          password: 'pass'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should successfully create a new admin if all parameters are properly provided', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({
          name: 'test',
          email: 'test@test.com',
          phone: '07000100000',
          password: 'passpasspa'
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          adminId = response.body._id;
        })
        .then(done);
    });

    it('should not permit creation of an admin with existing email or phone', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({
          name: 'test',
          email: 'test@test.com',
          phone: '07000100000',
          password: 'passpasspa'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });
  });

  describe('can login;', () => {
    it('should reject if body is empty', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if invalid email is sent for login', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .send({ email: 'test' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if no password is provided', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .send({ email: 'test@test.com' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if insufficient password is provided', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'test@test.com',
          password: 'pass'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if wrong password is provided', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'test@test.com',
          password: 'passwrong'
        })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if inexistent email is sent for login', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .send({ email: 'test0@tes1.com', password: 'passwrong' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should login and return token if correct email and password is provided', (done) => {
      request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'test@test.com',
          password: 'passpasspa'
        })
        .expect(201)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.token).toBeDefined();
          adminToken = response.body.token;
        })
        .then(done);
    });
  });

  describe('uses auth middleware;', () => {
    it('should deny access, if authorization header token in absent', (done) => {
      request(app)
        .get(`/api/v1/admin/${adminId}`)
        .expect(403)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should deny access, if authorization header token in invalid', (done) => {
      request(app)
        .get(`/api/v1/admin/${adminId}`)
        .set('Authorization', 'Bearer someRandomToken')
        .expect(403)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });
  });

  describe('obtains id from URL for CRUD operations;', () => {
    it('should reject if given an inexistent id in URL parameters', (done) => {
      request(app)
        .get('/api/v1/admin/someRandomId')
        .expect(400)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject if given an invalid id in URL parameters', (done) => {
      request(app)
        .get('/api/v1/admin/0000000')
        .expect(400)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });
  });

  describe('can be viewed;', () => {
    it('should return all its details if given the right id and the authorization header token is valid and has not expired', (done) => {
      request(app)
        .get(`/api/v1/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.email).toBeDefined();
        })
        .then(done);
    });
  });

  describe('can have its details updated;', () => {
    it('should reject updates if empty request body is sent', (done) => {
      request(app)
        .put(`/api/v1/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(422)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject updates if neither of name, email and phone are sent', (done) => {
      request(app)
        .put(`/api/v1/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(422)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);

      request(app)
        .put(`/api/v1/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ irrelevant: 'really irrelevant' })
        .expect(422)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject update of an admin with existing email or phone', (done) => {
      request(app)
        .post('/api/v1/admin')
        .send({
          name: 'test',
          email: 'test1@test.com',
          phone: '07000110000',
          password: 'passpasspa'
        })
        .then(() => {
          request(app)
            .put(`/api/v1/admin/${adminId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              email: 'test1@test.com',
              phone: '07000110000'
            })
            .expect(422)
            .expect((response) => expect(response.body.success).toBeFalse())
            .then(done);
        });
    });

    it('should update its details when given apprioprate data, the right id and the right token', (done) => {
      request(app)
        .put(`/api/v1/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'retest',
          email: 'retest@test.com',
          phone: '07003000000'
        })
        .expect(202)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          // update adminToken as the email has changed
          adminToken = response.body.token;
        })
        .then(done);
    });
  });

  describe('can have its password updated;', () => {
    it('should reject password change if both old and new passwords are not in request body', (done) => {
      request(app)
        .put(`/api/v1/admin/password/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(422)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject password change if old password is wrong', (done) => {
      request(app)
        .put(`/api/v1/admin/password/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ old_password: 'passwrong', new_password: 'newerpass' })
        .expect(401)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should reject password change if new password is short', (done) => {
      request(app)
        .put(`/api/v1/admin/password/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ old_password: 'passpasspa', new_password: 'newer' })
        .expect(422)
        .expect((response) => expect(response.body.success).toBeFalse())
        .then(done);
    });

    it('should be capable of changing password, generate new token and invalidate old tokens', (done) => {
      let oldToken;
      request(app)
        .put(`/api/v1/admin/password/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ old_password: 'passpasspa', new_password: 'newerpass' })
        .expect(202)
        .expect((response) => {
          expect(response.body.success).toBeTrue();
          expect(response.body.token).toBeDefined();
          oldToken = adminToken;
          adminToken = response.body.token;
        })
        .then(() =>
          request(app)
            .get(`/api/v1/admin/${adminId}`)
            .set('Authorization', `Bearer ${oldToken}`)
            .expect(403)
            .expect((response) => expect(response.body.success).toBeFalse())
            .then(done)
        );
    });
  });

  describe('can be deleted;', () => {
    it('', (done) => {
      request(app)
        .delete(`/api/v1/admin/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204)
        .then(done);
    });
  });
});
