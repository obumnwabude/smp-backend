// const Admin = require('../models/admin');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
const handler = require('../utils/error_handler');

exports.createTeacher = (req, res) => {
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
  }

  res.send(req.body);
};
