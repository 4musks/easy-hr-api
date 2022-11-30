const mongoose = require("mongoose");

const collection = "Users";

const { UserRoles, UserStatus } = require("../constants/Users");

const { Schema } = mongoose;

const UsersSchema = new Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    dob: {
      type: Date,
    },
    department: {
      type: String,
    },
    designation: {
      type: String,
    },
    joiningDate: {
      type: Date,
    },
    hourlyRate: {
      type: Number,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(UserRoles),
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenants",
      default: null,
    },
  },
  { timestamps: true }
);

const Users = mongoose.model(collection, UsersSchema);

module.exports = Users;
