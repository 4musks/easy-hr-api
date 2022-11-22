const mongoose = require("mongoose");

const collection = "Employees";

const { Schema } = mongoose;

const EmployeesSchema = new Schema(
    {
        managerUserId: {
            type: String,
        },
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
            type: String,
            index: true,
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
        annualIncome: {
            type: Number,
        },

    },
    { timestamps: true }
);

const Users = mongoose.model(collection, EmployeesSchema);

module.exports = Users;
