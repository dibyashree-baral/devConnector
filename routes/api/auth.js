const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const validator = require("validator");
const auth = require("../../middleware/auth");
const User = require("../../model/User");

/*
@route - api/auth
@desc - Authenticate users
@access - private
*/
router.get("/", auth, async (req, res) => {
  try {
    const authenticatedUser = await User.findById(req.userId).select(
      "-password"
    );
    if (!authenticatedUser)
      return res.status(401).send({ error: "Token is not valid" });
    res.send(authenticatedUser);
  } catch (err) {
    res.status(500).send(err);
  }
});

/*
@route - api/login
@desc - Login user
@access - public
*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new Error("email and password fields are mandatory");
    if (!validator.isEmail(email))
      throw new Error("Please provide a valid email address");
    if (password.length < 8)
      throw new Error("Password must be of 8 or more characters");

    //check whether user exists or not using auth token
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send({ error: "Invalid credentials" });

    //check if password matches or not
    const isPasswordMatch = bcrypt.compareSync(password, user.password);
    if (!isPasswordMatch)
      return res.status(401).send({ error: "Invalid credentials" });

    //get jwt token
    jwt.sign(
      {
        id: user.id,
      },
      config.get("jwtTokenKey"),
      { expiresIn: "1h" },
      (err, token) => {
        if (err) return res.status(400).send(err);
        res.status(201).send({ token, user });
      }
    );
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
