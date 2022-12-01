const express = require("express");

const router = express.Router();

const FeedbackModel = require("../../models/Feedback");
const { UserRoles } = require("../../constants/Users");
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

    const {
      tenantId,
      userId,
      user: { role },
    } = token;

    let filter = {
      tenant: tenantId,
    };

    if (role === UserRoles.MANAGER || role === UserRoles.EMPLOYEE) {
      filter = {
        ...filter,
        $or: [
          {
            user: userId,
          },
          {
            manager: userId,
          },
        ],
      };
    }

    const feedback = await FeedbackModel.find(filter)
      .populate("user")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    logger.error("GET /v1/feedback -> error : ", error);
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

    const { userId, tenantId, user } = token;

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

    const payload = {
      description,
      isAnonymous,
      user: userId,
      tenant: tenantId,
    };

    if (user.role === UserRoles.EMPLOYEE) {
      payload.manager = user.manager;
    }

    await new FeedbackModel(payload).save();

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

router.put("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { id, description, isAnonymous } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required." });
    }

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

    await FeedbackModel.findOneAndUpdate(
      { _id: id },
      { description, isAnonymous }
    );

    return res
      .status(200)
      .json({ success: true, message: "Feedback updated successfully." });
  } catch (error) {
    logger.error("PUT /v1/feedback -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

router.delete("/", async (req, res) => {
  try {
    const token = await validateToken(req.headers);

    if (token.error) {
      return res
        .status(token.status)
        .json({ success: false, message: token.message });
    }

    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required." });
    }

    await FeedbackModel.findOneAndRemove({ _id: id });

    return res
      .status(200)
      .json({ success: true, message: "Feedback removed successfully." });
  } catch (error) {
    logger.error("DELETE /v1/feedback -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
