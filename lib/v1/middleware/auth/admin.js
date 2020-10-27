const jwt = require('jsonwebtoken');
const handler = require('../../utils/error_handler');

module.exports = (req, res, next) => {
  // check the authorization for token matching
  try {
    // get the token from request headers
    const token = req.headers.authorization.split(' ')[1];
    const payload = jwt.verify(token, '4RanDom$');
    const admin = res.locals.admin;
    if (
      payload.email === admin.email &&
      new Date(payload.issueDate) >= new Date(admin.lastPasswordChange)
    ) {
      // pass execution to next action
      next();
    } else {
      throw new Error('Access not Permitted');
    }
  } catch (error) {
    error.name === 'TokenExpiredError'
      ? handler(res, 403, 'Session expired, please login again')
      : handler(res, 403, error.message);
  }
};
