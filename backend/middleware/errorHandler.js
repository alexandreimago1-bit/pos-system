const errorHandler = (error, req, res, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }else if (error.code === 11000) {
    return res.status(409).json({ error: 'duplicate barcode' });
  }

  res.status(500).json({ error: 'internal server error' });

};

module.exports = errorHandler;