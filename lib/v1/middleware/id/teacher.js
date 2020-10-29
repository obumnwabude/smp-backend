const Teacher = require('../../models/teacher');
const handler = require('../../utils/error_handler');

module.exports = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id });
    if (!teacher) {
      return handler(
        res,
        400,
        `Teacher with teacherId: ${req.params.id} not found.`
      );
    } else {
      res.locals.teacher = teacher;
      next();
    }
  } catch (error) {
    return error.name === 'CastError'
      ? handler(res, 400, `Invalid teacherId: ${req.params.id} provided`)
      : handler(res, 500, error.message);
  }
};
