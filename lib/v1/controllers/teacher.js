const Teacher = require('../models/teacher');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const handler = require('../utils/error_handler');
const { emailRegex, phoneRegex } = require('../utils/regex');

exports.createTeacher = async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || name.length < 2) {
    return handler(res, 401, 'Please provide a valid name');
  } else if (!email || !emailRegex.test(email)) {
    return handler(res, 401, 'Please provide a valid email');
  } else if (!phone || !phoneRegex.test(phone)) {
    return handler(res, 401, 'Please provide a valid nigerian phone number');
  }

  try {
    const password = '00000000';
    const hashed = await bcrypt.hash(password, 10);
    const teacher = new Teacher({ name, email, phone, password: hashed });
    await teacher.save();
    return res.status(201).json({
      name,
      email,
      phone,
      password,
      _id: teacher._id,
      success: true,
      message: 'Teacher successfully created!'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      let errorMessage = '';
      for (let key of Object.keys(error.errors)) {
        errorMessage +=
          `Teacher with ${key}: ${error.errors[key].value} exists ` +
          `already, use another ${key} to create this teacher<br>`;
      }
      return handler(res, 422, errorMessage);
    } else {
      return handler(res, 500, error.message);
    }
  }
};

exports.loginTeacher = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !emailRegex.test(email)) {
    return handler(res, 401, 'Please provide a valid email');
  } else if (!password || password.length < 8) {
    return handler(res, 401, 'Please provide a valid password');
  }

  try {
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return handler(
        res,
        401,
        `Teacher with email: ${email} not found. Check again or sign up`
      );
    } else {
      const isPasswordCorrect = await bcrypt.compare(
        password,
        teacher.password
      );
      if (isPasswordCorrect) {
        teacher.lastLogin = new Date();
        await teacher.save();
        const token = await jwt.sign(
          { email, issueDate: new Date() },
          '4RanDom$',
          { expiresIn: '1w' }
        );
        return res.status(201).json({
          success: true,
          message: 'Login Successful',
          _id: teacher._id,
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
