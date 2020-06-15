const jwt = require("jsonwebtoken");
const config = require("config");

const auth = async (req, res, next) => {
  if (!req.get("Authorization"))
    res.status(401).send({ error: "No token..Authorization denied" });

  try {
    var decodedToken = await jwt.verify(
      req.get("Authorization").replace("Bearer ", ""),
      config.get("jwtTokenKey")
    );
    if (!decodedToken) {
      res.status(401).send({ error: "Authorization denied" });
    }
    req.userId = decodedToken.id;
    next();
  } catch (error) {
    res.status(401).send({ error: "Token is invalid" });
  }
};

module.exports = auth;
