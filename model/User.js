const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate(value) {
      if (value.length === 0) throw new Error("Name cannot be empty");
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value))
        throw new Error("Please provide a valid email address");
    },
  },
  password: {
    type: String,
    required: true,
    validate(value) {
      if (value.length < 8)
        throw new Error("Password must be of 8 or more characters");
    },
  },
  avatar: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

UserSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = User = mongoose.model("user", UserSchema);
