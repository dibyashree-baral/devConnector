const express = require("express");
require("./config/db");

const port = process.env.PORT || 4000;

const app = express();
app.use(express.json({ extended: false }));

app.use("/api/users", require("./routes/api/users"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/auth", require("./routes/api/auth"));

app.get("/", (req, res) => {
  res.send(`server is running on ${port}`);
});
app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
