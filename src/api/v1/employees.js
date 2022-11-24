const express = require("express");
const {
  AWS_FROM_EMAIL,
  AWS_REGION,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
} = require("../../utils/config");
const AWS = require("aws-sdk");

const router = express.Router();
const EmployeesModel = require("../../models/Employees");
const { validateToken } = require("../../utils/common");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../utils/constants");
const logger = require("../../utils/logger");
AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
});

//const nodemailer = require("nodemailer");
const UsersModel = require("../../models/Users");

router.get("/", async (req, res) => {
  const token = await validateToken(req.headers);

  if (token.error) {
    return res
      .status(token.status)
      .json({ success: false, message: token.message });
  }

  const { userId } = token;
  const user = await UsersModel.findById(userId);
  const employee = await EmployeesModel.findOne({ email: user.email });
  const employees = await EmployeesModel.find({ managerUserId: userId });

  return res
    .status(200)
    .json({ success: true, data: { profile: employee, employees: employees } });
});

router.post("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId } = token;
    const {
      firstName,
      lastName,
      email,
      dob,
      department,
      designation,
      joiningDate,
      annualIncome,
    } = req.body;

    if (!firstName) {
      return res
        .status(400)
        .json({ success: false, message: "firstName is required." });
    }

    if (!lastName) {
      return res
        .status(400)
        .json({ success: false, message: "lastName is required." });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "email is required." });
    }

    if (!dob) {
      return res
        .status(400)
        .json({ success: false, message: "dob is required." });
    }

    if (!department) {
      return res
        .status(400)
        .json({ success: false, message: "department is required." });
    }

    if (!designation) {
      return res
        .status(400)
        .json({ success: false, message: "designation is required." });
    }

    if (!joiningDate) {
      return res
        .status(400)
        .json({ success: false, message: "joiningDate is required." });
    }

    if (!annualIncome) {
      return res
        .status(400)
        .json({ success: false, message: "annualIncome is required." });
    }

    await new EmployeesModel({
      managerUserId: userId,
      firstName,
      lastName,
      email,
      dob,
      department,
      designation,
      joiningDate,
      annualIncome,
    }).save();
    /* 
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "testeasyhr27@gmail.com",
        pass: "qqajwvydjejxrxgq",
      },
    });

    const mailOptions = {
      from: "testeasyhr27@gmail.com",
      to: email,
      subject: "Welcome to easyHR",
      text: `Welcome to easyHR! ${firstName}`,
    };

    let emailCheck;
    try {
      emailCheck = await transporter.sendMail(mailOptions);
    } catch (e) {
      emailCheck = e;
    }
 */
    // Create sendEmail params
    const params = {
      Source: AWS_FROM_EMAIL,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: "Welcome to easyHR",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<p>Welcome to easyHR! ${firstName}</p>`,
          },
        },
      },
    };

    // send email notification for response
    const sendPromise = new AWS.SES({ apiVersion: "2010-12-01" })
      .sendEmail(params)
      .promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
      .then(function (data) {
        logger.info(data.MessageId);
      })
      .catch(function (err) {
        logger.error(err, err.stack);
      });

    return res.status(200).json({
      success: true,
      message: "Employee created successfully.",
    });
  } catch (error) {
    logger.error("POST /v1/employees -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
