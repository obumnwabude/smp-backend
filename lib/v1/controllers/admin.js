const Admin = require('../models/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handler = require('../utils/error_handler');

exports.createAdmin = (req, res) => {
  // ensures that valid name, email, phone and password are provided
  if (!req.body.name || req.body.name.length < 2) {
    return handler(res, 401, 'Please provide a valid name');
  } else if (
    !req.body.email ||
    // eslint-disable-next-line no-useless-escape
    !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)
  ) {
    return handler(res, 401, 'Please provide a valid email');
  } else if (!req.body.phone || !/^0[789][01]\d{8}$/.test(req.body.phone)) {
    return handler(res, 401, 'Please provide a valid nigerian phone number');
  } else if (!req.body.password || req.body.password.length < 8) {
    return handler(
      res,
      401,
      'Please provide a password of at least 8 characters'
    );
  }
  // hash the password from req.body
  return bcrypt
    .hash(req.body.password, 10)
    .then((hashed) => {
      // create a new admin
      const admin = new Admin({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: hashed
      });
      // save and return the admin
      return admin
        .save()
        .then(() =>
          res.status(201).json({
            success: true,
            message: 'Admin successfully created!',
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone
          })
        )
        .catch((error) => {
          // check if email or phone is not unique and return proper message
          if (error.name === 'ValidationError') {
            let errorMessage = '';
            for (let key of Object.keys(error.errors)) {
              errorMessage += `Admin with ${key}: ${error.errors[key].value} exists already, use another ${key} to create this admin<br>`;
            }
            return handler(res, 401, errorMessage);
          } else {
            return handler(res, 500, error.message);
          }
        });
    })
    .catch((error) => handler(res, 500, error.message));
};

exports.loginAdmin = (req, res) => {
  // ensure that email and password for login were found in body else return
  if (
    !req.body.email ||
    // eslint-disable-next-line no-useless-escape
    !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(req.body.email)
  ) {
    return handler(res, 401, 'Please provide a valid email');
  }
  if (!req.body.password || req.body.password.length < 8) {
    return handler(res, 401, 'Please provide a valid password');
  }

  // get admin with provided email from database
  Admin.findOne({ email: req.body.email })
    .then((admin) => {
      // admin was not found return
      if (!admin) {
        return handler(
          res,
          401,
          `Admin with email: ${req.body.email} not found. Check again or sign up`
        );
      } else {
        // if admin was found, compare passwords
        return bcrypt
          .compare(req.body.password, admin.password)
          .then((valid) => {
            // if passwords don't match return
            if (!valid) {
              return handler(res, 401, 'Wrong password');
            } else {
              // update login time on admin
              admin.lastLogin = new Date();
              return admin
                .save()
                .then(() => {
                  // if passwords match, sign token with email and return
                  const token = jwt.sign(
                    { email: admin.email, issueDate: new Date() },
                    '4RanDom$',
                    {
                      expiresIn: '6h'
                    }
                  );
                  return res.status(201).json({
                    success: true,
                    message: 'Login Successful',
                    _id: admin._id,
                    email: admin.email,
                    token: token
                  });
                })
                .catch((error) => handler(res, 500, error.message));
            }
          })
          .catch((error) => handler(res, 500, error.message));
      }
    })
    .catch((error) => handler(res, 500, error.message));
};

exports.getAdmin = (req, res) => {
  // the admin from res.locals
  const admin = res.locals.admin;
  return res.status(200).json({
    success: true,
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    dateCreated: admin.dateCreated,
    lastLogin: admin.lastLogin,
    lastPasswordChange: admin.lastPasswordChange
  });
};

exports.updateAdmin = async (req, res) => {
  // get admin to be updated from res.locals
  const admin = res.locals.admin;
  // check and ensure that there is something to be updated in the admin from request body
  if (!(req.body.name || req.body.email || req.body.phone)) {
    return handler(
      res,
      422,
      'Please provide valid name, email or phone update with'
    );
  }

  // if email was change, tokens will be invalid. so sign new token and send with changed email
  let wasEmailChanged = false;

  // update with the provided body data
  if (req.body.name) admin.name = req.body.name;
  if (req.body.phone) admin.phone = req.body.phone;
  if (req.body.email) {
    admin.email = req.body.email;
    wasEmailChanged = true;
  }

  // save to database and return
  return admin
    .save()
    .then((updated) => {
      const returnBody = {
        success: true,
        message: 'Update Successful',
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone
      };
      if (wasEmailChanged) {
        returnBody.token = jwt.sign(
          { email: updated.email, issueDate: new Date() },
          '4RanDom$',
          {
            expiresIn: '6h'
          }
        );
      }
      return res.status(202).json(returnBody);
    })
    .catch((error) => {
      // check if email or phone is not unique and return proper message
      if (error.name === 'ValidationError') {
        let errorMessage = '';
        for (let key of Object.keys(error.errors)) {
          errorMessage += `Admin with ${key}: ${error.errors[key].value} exists already, use another ${key} to create this admin<br>`;
        }
        return handler(res, 422, errorMessage);
      } else {
        return handler(res, 500, error.message);
      }
    });
};

exports.updateAdminPassword = (req, res) => {
  if (req.body.old_password && req.body.new_password) {
    // get admin to be updated from res.locals
    const admin = res.locals.admin;
    return bcrypt
      .compare(req.body.old_password, admin.password)
      .then((valid) => {
        if (valid) {
          return bcrypt
            .hash(req.body.new_password, 10)
            .then((hashed) => {
              admin.password = hashed;
              admin.lastPasswordChange = new Date();
              return admin
                .save()
                .then(() => {
                  // if passwords match, sign token with email and return
                  const token = jwt.sign(
                    { email: admin.email, issueDate: new Date() },
                    '4RanDom$',
                    { expiresIn: '6h' }
                  );
                  res.status(202).json({
                    success: true,
                    message: 'Password Update Successful',
                    _id: admin._id,
                    token: token
                  });
                })
                .catch((error) => handler(res, 500, error.message));
            })
            .catch((error) => handler(res, 500, error.message));
        } else {
          return handler(res, 401, 'Wrong password');
        }
      })
      .catch((error) => handler(res, 500, error.message));
  } else {
    return handler(
      res,
      422,
      'Please provide old and new passwords update with'
    );
  }
};

exports.deleteAdmin = (req, res) => {
  return res.locals.admin
    .delete()
    .then(() => res.status(204).end())
    .catch((error) => handler(res, 500, error.message));
};
