const config = require("config");
const mongoose = require("mongoose");

const dbConfig = config.get("database.mongodbUrl");

mongoose.connect(
  dbConfig,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  (error, client) => {
    if (error) {
      console.log(error.message);
      process.exit(1);
    }
    console.log("db connected");
  }
);
