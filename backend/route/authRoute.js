const express = require("express");
const {
  signup,
  login,
  forgetPass,
  resetPass,
} = require("../controller/authcontroller");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgetPass);
router.post("/reset_pass/:id", resetPass);
module.exports = router;
