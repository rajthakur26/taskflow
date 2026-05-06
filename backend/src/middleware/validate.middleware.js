const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response.utils');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Validation failed',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

module.exports = { validate };
