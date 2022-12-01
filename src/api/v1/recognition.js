const express = require("express");

const router = express.Router();

const RecognitionModel = require("../../models/Recognition");
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

    const recognition = await RecognitionModel.find({
      tenant: tenantId,
    })
      .sort({ createdAt: -1 })
      .populate("fromUser toUser companyValue");

    return res.status(200).json({ success: true, data: recognition });
  } catch (error) {
    logger.error("GET /v1/recognition -> error : ", error);
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

    const { tenantId, userId } = token;

    const { toUser, companyValue, description } = req.body;

    if (!toUser) {
      return res
        .status(400)
        .json({ success: false, message: "Employee is required." });
    }

    if (!companyValue) {
      return res
        .status(400)
        .json({ success: false, message: "Company value is required." });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required." });
    }

    await new RecognitionModel({
      fromUser: userId,
      toUser,
      companyValue,
      description,
      tenant: tenantId,
    }).save();

    return res
      .status(200)
      .json({ success: true, message: "Recognition added successfully." });
  } catch (error) {
    logger.error("POST /v1/recognition -> error : ", error);
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

    const { id, companyValue, description } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required." });
    }

    if (!companyValue) {
      return res
        .status(400)
        .json({ success: false, message: "Company value is required." });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required." });
    }

    await RecognitionModel.findOneAndUpdate(
      { _id: id },
      {
        companyValue,
        description,
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Recognition updated successfully." });
  } catch (error) {
    logger.error("PUT /v1/recognition -> error : ", error);
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

    await RecognitionModel.findOneAndRemove({ _id: id });

    return res
      .status(200)
      .json({ success: true, message: "Recognition deleted successfully." });
  } catch (error) {
    logger.error("DELETE /v1/recognition -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
