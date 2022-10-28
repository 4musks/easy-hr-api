const mongoose = require("mongoose");

const collection = "Tenants";

const { Schema } = mongoose;

const TenantsSchema = new Schema(
  {
    subdomain: {
      type: String,
    },
    enabled: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Tenants = mongoose.model(collection, TenantsSchema);

module.exports = Tenants;
