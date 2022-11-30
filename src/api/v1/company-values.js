const express = require("express");

const router = express.Router();

const CompanyValuesModel = require("../../models/CompanyValues");
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

    const companyValues = await CompanyValuesModel.find({
      tenant: tenantId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: companyValues });
  } catch (error) {
    logger.error("GET /v1/company-values -> error : ", error);
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

    const { tenantId } = token;

    const { title, description } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required." });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required." });
    }

    await new CompanyValuesModel({
      title,
      description,
      tenant: tenantId,
    }).save();

    return res
      .status(200)
      .json({ success: true, message: "Company value added successfully." });
  } catch (error) {
    logger.error("POST /v1/company-values -> error : ", error);
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

    const { tenantId } = token;

    const { id, title, description } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required." });
    }

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required." });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "Description is required." });
    }

    await CompanyValuesModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        title,
        description,
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Company value updated successfully." });
  } catch (error) {
    logger.error("PUT /v1/company-values -> error : ", error);
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

    await CompanyValuesModel.findOneAndRemove({
      _id: id,
    });

    return res
      .status(200)
      .json({ success: true, message: "Company value removed successfully." });
  } catch (error) {
    logger.error("DELETE /v1/company-values -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
