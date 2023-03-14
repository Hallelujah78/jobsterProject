const express = require("express");
const auth = require("../middleware/authentication");
const testUser = require("../middleware/testUser");
const router = express.Router();
const { register, login, updateUser } = require("../controllers/auth");
const rateLimiter = require("express-rate-limit");

const apiLimiter = rateLimiter({
  windowMS: 60 * 1000 * 15,
  max: 10,
  message: {
    msg: "Too many requests from this IP, please try again after 15 minutes",
  },
});

router.post("/register", apiLimiter, register);
router.post("/login", apiLimiter, login);
router.patch("/updateUser", auth, testUser, updateUser);

module.exports = router;
