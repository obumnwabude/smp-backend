const jwt = require('jsonwebtoken');
const handler = require('../../utils/error_handler');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const payload = jwt.verify(token, '4RanDom$');
    const teacher = res.locals.teacher;
    if (
      payload.email === teacher.email &&
      new Date(payload.issueDate) >= new Date(teacher.lastPasswordChange)
    ) {
      next();
    } else {
      throw new Error('Access not Permitted');
    }
  } catch (error) {
    return error.name === 'TokenExpiredError'
      ? handler(res, 403, 'Session expired, please login again')
      : handler(res, 403, error.message);
  }
};
