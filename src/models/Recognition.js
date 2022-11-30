const mongoose = require("mongoose");

const collection = "Recognition";

const { Schema } = mongoose;

const RecognitionSchema = new Schema(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    companyValue: {
      type: Schema.Types.ObjectId,
      ref: "CompanyValues",
      default: null,
    },
    description: {
      type: String,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenants",
      default: null,
    },
  },
  { timestamps: true }
);

const Recognition = mongoose.model(collection, RecognitionSchema);

module.exports = Recognition;
