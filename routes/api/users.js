const express = require("express");
const User = require("../../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const gravatar = require("gravatar");
const config = require("config");

/*
@route - api/users
@desc - register users
@access - public
*/
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);

    //check if user already exists
    const isExistingUser = await User.findOne({ email: req.body.email });
    if (isExistingUser)
      return res.status(400).send({ error: "user already exists" });

    //get avatar
    user.avatar = gravatar.url(req.body.email, {
      s: "200",
      r: "pg",
      d: "404",
    });

    //encrypt the password
    user.password = bcrypt.hashSync(req.body.password, 10);

    //get jwt token
    const success = await user.save();
    if (success) {
      const token = jwt.sign(
        {
          id: success.id,
        },
        config.get("jwtTokenKey"),
        { expiresIn: "1h" },
        (err, token) => {
          if (err) res.status(400).send(err);
          res.status(201).send({ token });
        }
      );
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
