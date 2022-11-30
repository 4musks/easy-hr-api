const express = require("express");
const AWS = require("aws-sdk");

const router = express.Router();

const UsersModel = require("../../models/Users");
const TenantsModel = require("../../models/Tenants");
const { UserRoles, UserStatus } = require("../../constants/Users");
const {
  createSalt,
  hashPassword,
  encodeJWT,
  decodeJWT,
} = require("../../utils/jwt");
const { validateToken } = require("../../utils/common");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../utils/constants");
const {
  APP_URL,
  AWS_FROM_EMAIL,
  AWS_REGION,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
} = require("../../utils/config");
const logger = require("../../utils/logger");

AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
});

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    const subdomain = req.headers["x-subdomain"];

    if (!subdomain) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid params." });
    }

    const tenant = await TenantsModel.findOne({ subdomain });

    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: "Tenant does not exist.",
      });
    }

    if (!firstName) {
      return res
        .status(400)
        .json({ success: false, message: "First name is required." });
    }

    if (!lastName) {
      return res
        .status(400)
        .json({ success: false, message: "Last name is required." });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required." });
    }

    if (!confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Confirm password is required." });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    const user = await UsersModel.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with email already exists. Please sign in.",
      });
    }

    const hashedPassword = hashPassword(password, createSalt());

    const newUser = await new UsersModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: UserRoles.MEMBER,
      tenant: tenant._id,
    }).save();

    const token = encodeJWT({ userId: newUser._id });

    return res
      .status(200)
      .json({ success: true, data: { user: newUser, token } });
  } catch (error) {
    logger.error("POST /v1/users/signup -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .json({ success: false, message: "Email is required." })
        .status(400);
    }

    const user = await UsersModel.findOne({ email }).populate("tenant");

    if (!user) {
      return res
        .json({
          success: false,
          message:
            "User with email does not exist. Please check your credentials and try again.",
        })
        .status(400);
    }

    user.status = UserStatus.ACTIVE;
    user.save();

    const token = encodeJWT({ userId: user._id });

    return res.status(200).json({
      success: true,
      data: { user, token, subdomain: user.tenant.subdomain },
    });
  } catch (error) {
    logger.error("POST /v1/users/signin -> error : ", error);

    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.get("/info", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId } = token;

    const user = await UsersModel.findById(userId);

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error("GET /v1/users/info -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.put("/profile", async (req, res) => {
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
      hourlyRate,
      role,
      manager,
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

    if (!hourlyRate) {
      return res
        .status(400)
        .json({ success: false, message: "Hourly rate is required." });
    }

    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Role is required." });
    }

    if (role === UserRoles.EMPLOYEE && !manager) {
      return res
        .status(400)
        .json({ success: false, message: "Manager is required." });
    }

    await UsersModel.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        firstName,
        lastName,
        email,
        dob,
        department,
        designation,
        joiningDate,
        hourlyRate,
        role,
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    logger.error("PUT /v1/users/profile -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.get("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const {
      userId,
      user: { role },
    } = token;

    const { all } = req.query;

    let filter = {};

    if (!all) {
      if (role === UserRoles.ADMIN) {
        filter = {
          _id: { $ne: userId },
        };
      }

      if (role === UserRoles.MANAGER) {
        filter = {
          manager: userId,
        };
      }

      if (role === UserRoles.EMPLOYEE) {
        filter = {
          _id: userId,
        };
      }
    }

    const users = await UsersModel.find(filter);

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error("GET /v1/users -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/invite", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const {
      tenant: { _id: tenantId, subdomain },
    } = token;

    const {
      firstName,
      lastName,
      email,
      dob,
      department,
      designation,
      joiningDate,
      hourlyRate,
      role,
      manager,
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

    if (!hourlyRate) {
      return res
        .status(400)
        .json({ success: false, message: "Hourly rate is required." });
    }

    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Role is required." });
    }

    if (role === UserRoles.EMPLOYEE && !manager) {
      return res
        .status(400)
        .json({ success: false, message: "Manager is required." });
    }

    const payload = {
      firstName,
      lastName,
      email,
      dob,
      department,
      designation,
      joiningDate,
      hourlyRate,
      role,
      status: UserStatus.PENDING,
      tenant: tenantId,
    };

    if (role === UserRoles.EMPLOYEE) {
      payload.manager = manager;
    }

    await new UsersModel(payload).save();

    const link = `http://${subdomain}.${APP_URL}/signin`;

    // Create sendEmail params
    const params = {
      Source: AWS_FROM_EMAIL,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: "Invitation from Easy HR!",
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
                <p>            
                  Hey there, hope you are doing good!
                </p>              
                <p>Please sign up by clicking on the below link, <br />
                  ${link}
                </p>
            `,
          },
        },
      },
    };

    // send email verification notification
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
      message: "Invitation sent successfully.",
    });
  } catch (error) {
    logger.error("POST /api/v1/users/invite -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/accept-invite", async (req, res) => {
  try {
    const { emailToken } = req.body;

    const decodedEmailToken = decodeJWT(emailToken);

    if (!decodedEmailToken || !decodedEmailToken.email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email token." });
    }

    const user = await UsersModel.findOne({ email: decodedEmailToken.email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Failed." });
    }

    await UsersModel.findOneAndUpdate(
      { email: decodedEmailToken.email },
      { status: UserStatus.ACTIVE },
      { new: true }
    );

    const token = encodeJWT({ userId: user._id });

    return res.status(200).json({
      success: true,
      data: {
        token,
      },
    });
  } catch (error) {
    logger.error("POST /api/v1/users/accept-invite -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
