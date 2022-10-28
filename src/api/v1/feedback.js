const express = require("express");

const router = express.Router();

const FeedbackModel = require("../../models/Feedback");
const { validateToken } = require("../../utils/common");
const { INTERNAL_SERVER_ERROR_MESSAGE } = require("../../utils/constants");
const logger = require("../../utils/logger");

router.get("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { tenantId } = token;

    const feedback = await FeedbackModel.find({
      tenant: tenantId,
    }).populate("user tenant");

    return res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    logger.error("POST /v1/feedback -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.post("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { userId, tenantId } = token;

    const { description, isAnonymous } = req.body;

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required." });
    }

    if (isAnonymous === null || isAnonymous === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Is Anonymous is required." });
    }

    await new FeedbackModel({
      description,
      isAnonymous,
      user: userId,
      tenant: tenantId,
    }).save();

    return res
      .status(200)
      .json({ success: true, message: "Feedback created successfully." });
  } catch (error) {
    logger.error("POST /v1/feedback -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
