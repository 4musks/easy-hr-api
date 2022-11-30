const mongoose = require("mongoose");

const collection = "Worklog";

const { Schema } = mongoose;

const WorklogSchema = new Schema(
  {
    serviceDate: {
      type: Date,
    },
    hours: {
      type: Number,
    },
    notes: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      default: null,
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

const Worklog = mongoose.model(collection, WorklogSchema);

module.exports = Worklog;
