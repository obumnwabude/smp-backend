const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

module.exports = mongoose.model(
  'Admin',
  new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateCreated: { type: Date, default: new Date() },
    lastLogin: { type: Date, default: new Date() },
    lastPasswordChange: { type: Date, default: new Date() }
  }).plugin(uniqueValidator)
);
