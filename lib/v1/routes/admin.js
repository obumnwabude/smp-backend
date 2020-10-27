const router = require('express').Router();
const ctrl = require('../controllers/admin');
const auth = require('../middleware/auth/admin');
const id = require('../middleware/id/admin');

router.post('/', ctrl.createAdmin);
router.post('/login', ctrl.loginAdmin);
router.get('/:id', id, auth, ctrl.getAdmin);
router.put('/:id', id, auth, ctrl.updateAdmin);
router.put('/password/:id', id, auth, ctrl.updateAdminPassword);
router.delete('/:id', id, auth, ctrl.deleteAdmin);

module.exports = router;
