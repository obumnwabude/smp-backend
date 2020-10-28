const router = require('express').Router();
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');

router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);

module.exports = router;
