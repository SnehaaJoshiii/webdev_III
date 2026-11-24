module.exports = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((item) => ({ field: item.path, message: item.message }))
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value',
      field: Object.keys(err.keyPattern || {})[0]
    });
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
