const Admin = require('../../models/admin');
const handler = require('../../utils/error_handler');

module.exports = (req, res, next) => {
  const adminId = req.params.id || req.body.adminId;
  if (!adminId) {
    // request body is specifically mentioned because
    // if there is no id in the url (/:id),
    // express's router will not route to admin routes ending in /:id
    return handler(res, 400, 'No adminId was provided in request body');
  }
  return Admin.findOne({ _id: adminId })
    .then((admin) => {
      if (!admin) {
        return handler(res, 400, `Admin with adminId: ${adminId} not found.`);
      } else {
        res.locals.admin = admin;
        next();
      }
    })
    .catch((error) => {
      error.name === 'CastError'
        ? handler(res, 400, `Invalid adminId: ${adminId} provided`)
        : handler(res, 500, error.message);
    });
};
