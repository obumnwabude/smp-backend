const Admin = require('../../models/admin');
const handler = require('../../utils/error_handler');

module.exports = (req, res, next) => {
  Admin.findOne({ _id: req.params.id })
    .then((admin) => {
      if (!admin) {
        return handler(
          res,
          400,
          `Admin with admin _id: ${req.params.id} not found.`
        );
      } else {
        res.locals.admin = admin;
        next();
      }
    })
    .catch((error) => {
      error.name === 'CastError'
        ? handler(res, 400, `Invalid Admin ID: ${req.params.id}`)
        : handler(res, 500, error.message);
    });
};
