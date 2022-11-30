const mongoose = require("mongoose");

const collection = "CompanyValues";

const { Schema } = mongoose;

const CompanyValuesSchema = new Schema(
  {
    title: {
      type: String,
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

const CompanyValues = mongoose.model(collection, CompanyValuesSchema);

module.exports = CompanyValues;
