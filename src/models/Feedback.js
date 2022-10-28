const mongoose = require("mongoose");

const collection = "Feedback";

const { getUserRoles } = require("../constants/UserRoles");

const { Schema } = mongoose;

const FeedbackSchema = new Schema(
  {
    description: {
      type: String,
    },
    isAnonymous: {
      type: Boolean,
    },
    user: {
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

const Feedback = mongoose.model(collection, FeedbackSchema);

module.exports = Feedback;
