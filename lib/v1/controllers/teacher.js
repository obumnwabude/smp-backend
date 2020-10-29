const Teacher = require('../models/teacher');
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
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
          `Admin with ${key}: ${error.errors[key].value} exists ` +
          `already, use another ${key} to create this admin<br>`;
      }
      return handler(res, 422, errorMessage);
    } else {
      return handler(res, 500, error.message);
    }
  }
};
