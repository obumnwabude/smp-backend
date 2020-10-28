const router = require('express').Router();
const ctrl = require('../controllers/teacher');
const adminAuth = require('../middleware/auth/admin');
const adminId = require('../middleware/id/admin');

router.post('/', adminId, adminAuth, ctrl.createTeacher);

module.exports = router;