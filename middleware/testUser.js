const { BadRequestError } = require("../errors");

const testUser = (req, res, next) => {
  if (req.user.testUser) {
    throw new BadRequestError("Demo user is read-only!");
  }
  next();
};

module.exports = testUser;
