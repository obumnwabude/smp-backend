const router = require('express').Router();
const ctrl = require('../controllers/teacher');
const adminAuth = require('../middleware/auth/admin');
const teacherAuth = require('../middleware/auth/teacher');
const adminId = require('../middleware/id/admin');
const teacherId = require('../middleware/id/teacher');

router.post('/', adminId, adminAuth, ctrl.createTeacher);
router.post('/login', ctrl.loginTeacher);
router.get('/:id', teacherId, teacherAuth, ctrl.getTeacher);
router.put('/:id', teacherId, teacherAuth, ctrl.updateTeacher);
router.put('/password/:id', teacherId, teacherAuth, ctrl.updatePassword);
router.put(
  '/password/default/:id',
  teacherId,
  teacherAuth,
  ctrl.updateDefaultPassword
);
router.delete('/:id', teacherId, teacherAuth, ctrl.deleteTeacher);

module.exports = router;
