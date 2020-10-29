const Admin = require('../models/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handler = require('../utils/error_handler');
const { emailRegex, phoneRegex } = require('../utils/regex');

exports.createAdmin = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || name.length < 2) {
    return handler(res, 401, 'Please provide a valid name');
  } else if (!email || !emailRegex.test(email)) {
    return handler(res, 401, 'Please provide a valid email');
  } else if (!phone || !phoneRegex.test(phone)) {
    return handler(res, 401, 'Please provide a valid nigerian phone number');
  } else if (!password || password.length < 8) {
    return handler(
      res,
      401,
      'Please provide a password of at least 8 characters'
    );
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, phone, password: hashed });
    await admin.save();
    return res.status(201).json({
      success: true,
      _id: admin._id,
      message: 'Admin successfully created!',
      name,
      email,
      phone
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      let errorMessage = '';
      for (let key of Object.keys(error.errors)) {
        errorMessage += `Admin with ${key}: ${error.errors[key].value} exists`;
        errorMessage += ` already, use another ${key} to create this admin<br>`;
      }
      return handler(res, 401, errorMessage);
    } else {
      return handler(res, 500, error.message);
    }
  }
};

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !emailRegex.test(email)) {
    return handler(res, 401, 'Please provide a valid email');
  } else if (!password || password.length < 8) {
    return handler(res, 401, 'Please provide a valid password');
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return handler(
        res,
        401,
        `Admin with email: ${email} not found. Check again or sign up`
      );
    } else {
      const isPasswordCorrect = await bcrypt.compare(password, admin.password);
      if (isPasswordCorrect) {
        admin.lastLogin = new Date();
        await admin.save();
        const token = await jwt.sign(
          { email, issueDate: new Date() },
          '4RanDom$',
          { expiresIn: '6h' }
        );
        return res.status(201).json({
          success: true,
          message: 'Login Successful',
          _id: admin._id,
          email,
          token
        });
      } else {
        return handler(res, 401, 'Wrong password');
      }
    }
  } catch (error) {
    return handler(res, 500, error.message);
  }
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
  const admin = res.locals.admin;
  const { name, email, phone } = req.body;

  if (!name || name.length < 2) {
    return handler(res, 422, 'Please provide a valid name');
  } else if (!email || !emailRegex.test(email)) {
    return handler(res, 422, 'Please provide a valid email');
  } else if (!phone || !phoneRegex.test(phone)) {
    return handler(res, 422, 'Please provide a valid nigerian phone number');
  }

  // if email was change, tokens will be invalid.
  // so sign new token and send with changed email
  let wasEmailChanged = false;

  // update with the provided body data
  if (name) admin.name = name;
  if (phone) admin.phone = phone;
  if (email) {
    admin.email = email;
    wasEmailChanged = true;
  }
  try {
    // save to database and return
    const updated = await admin.save();
    const returnBody = {
      success: true,
      message: 'Update Successful',
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone
    };
    if (wasEmailChanged) {
      returnBody.token = await jwt.sign(
        { email, issueDate: new Date() },
        '4RanDom$',
        { expiresIn: '6h' }
      );
    }
    return res.status(202).json(returnBody);
  } catch (error) {
    if (error.name === 'ValidationError') {
      let errorMessage = '';
      for (let key of Object.keys(error.errors)) {
        errorMessage +=
          `Admin with ${key}: ${error.errors[key].value} exists ` +
          `already, use another ${key} to create this admin<br>`;
      }
      return handler(res, 422, errorMessage);
    } else {
      return handler(res, 500, error.message);
    }
  }
};

exports.updateAdminPassword = async (req, res) => {
  if (req.body.old_password && req.body.new_password) {
    if (req.body.new_password.length < 8) {
      return handler(
        res,
        422,
        'Please provide a password of at least 8 characters'
      );
    }

    const admin = res.locals.admin;
    try {
      const valid = await bcrypt.compare(req.body.old_password, admin.password);
      if (valid) {
        const hashed = await bcrypt.hash(req.body.new_password, 10);
        admin.password = hashed;
        admin.lastPasswordChange = new Date();
        await admin.save();
        const token = await jwt.sign(
          { email: admin.email, issueDate: new Date() },
          '4RanDom$',
          { expiresIn: '6h' }
        );
        return res.status(202).json({
          success: true,
          message: 'Password Update Successful',
          _id: admin._id,
          token
        });
      } else {
        return handler(res, 401, 'Wrong password');
      }
    } catch (error) {
      return handler(res, 500, error.message);
    }
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
