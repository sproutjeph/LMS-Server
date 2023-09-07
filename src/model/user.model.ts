import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../config/server.config";

const HASH_VALUE = 10;

const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide a email"],
      validate: {
        validator: (email: string) => emailRegexPattern.test(email),
        message: "Please provide a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, HASH_VALUE);
  next();
});

// sign acces token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, ACCESS_TOKEN || "");
};
// sign resfresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, REFRESH_TOKEN || "");
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
