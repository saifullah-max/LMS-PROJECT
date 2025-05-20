const { isCelebrateError } = require("celebrate");

module.exports = (err, req, res, next) => {
  // Celebrate (Joi) validation error
  if (isCelebrateError(err)) {
    // extract the first validation message
    const [{ details }] = err.details.values();
    const message = details[0].message;
    return res.status(400).json({ msg: "Validation error", error: message });
  }

  // Custom thrown errors
  if (err.status && err.message) {
    return res.status(err.status).json({ msg: err.message });
  }

  console.error(err);
  res.status(500).json({ msg: "Server error", error: err.message });
};
