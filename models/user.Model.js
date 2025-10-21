const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "You must put a name"],
    },
    lastName: {
      type: String,
      required: [true, "You must put a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      lowercase: true,
      trim: true,
      unique: true,
      validators: [validator.isEmail, "Please validate your email"],
    },
    phone: {
      type: String,
      required: [true, "Please provide your phone"],
      validate: {
        validator: (v) => validator.isMobilePhone(v, "ar-EG"),
        message: "invalid phone number or this not egyption number",
      },
    },
    address: String,
    photo: { type: String, default: "default.jpg" },
    photoPublicId: String,
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
  },
  { timestamps: true }
);
userSchema.index({ email: 1 }, { unique: true });
userSchema.pre('save',async function(next){
  if(!this.isModified("password"))return next();
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  
  return next();
});
const User = mongoose.model("User", userSchema);
module.exports = User;