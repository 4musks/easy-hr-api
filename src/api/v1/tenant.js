const express = require("express");

const router = express.Router();

const TenantsModel = require("../../models/Tenants");
// const { validateToken } = require("../../utils/common");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../utils/constants");
const logger = require("../../utils/logger");

router.post("/", async (req, res) => {
  try {
    // const token = await validateToken(req.headers);

    // if (token.error) {
    //   return res
    //     .status(token.status)
    //     .json({ success: false, message: token.message });
    // }

    const { subdomain } = req.body;

    if (!subdomain) {
      return res
        .status(400)
        .json({ success: false, message: "Subdomain is required." });
    }

    await new TenantsModel({
      subdomain,
      enabled: true,
    }).save();

    return res.status(200).json({
      success: true,
      message: "Tenant created successfully.",
    });
  } catch (error) {
    logger.error("POST /v1/tenant -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
