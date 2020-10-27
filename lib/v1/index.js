const router = require('express').Router();
const adminRoutes = require('./routes/admin');

router.use('/admin', adminRoutes);

module.exports = router;
