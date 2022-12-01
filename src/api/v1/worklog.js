const express = require("express");

const router = express.Router();

const WorklogModel = require("../../models/Worklog");
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

    const worklog = await WorklogModel.find(filter)
      .populate("user")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: worklog });
  } catch (error) {
    logger.error("GET /v1/worklog -> error : ", error);
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

    const { serviceDate, hours, notes } = req.body;

    if (!serviceDate) {
      return res
        .status(400)
        .json({ success: false, message: "Service date is required." });
    }

    if (!hours) {
      return res
        .status(400)
        .json({ success: false, message: "Hours is required." });
    }

    if (!notes) {
      return res
        .status(400)
        .json({ success: false, message: "Notes is required." });
    }

    const payload = {
      serviceDate,
      hours,
      notes,
      user: userId,
      tenant: tenantId,
    };

    if (user.role === UserRoles.EMPLOYEE) {
      payload.manager = user.manager;
    }

    await new WorklogModel(payload).save();

    return res
      .status(200)
      .json({ success: true, message: "Worklog created successfully." });
  } catch (error) {
    logger.error("POST /v1/worklog -> error : ", error);
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

    const { id, serviceDate, hours, notes } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required." });
    }

    if (!serviceDate) {
      return res
        .status(400)
        .json({ success: false, message: "Service date is required." });
    }

    if (!hours) {
      return res
        .status(400)
        .json({ success: false, message: "Hours is required." });
    }

    if (!notes) {
      return res
        .status(400)
        .json({ success: false, message: "Notes is required." });
    }

    await WorklogModel.findOneAndUpdate(
      { _id: id },
      {
        serviceDate,
        hours,
        notes,
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Worklog updated successfully." });
  } catch (error) {
    logger.error("PUT /v1/worklog -> error : ", error);
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

    await WorklogModel.findOneAndRemove({ _id: id });

    return res
      .status(200)
      .json({ success: true, message: "Worklog removed successfully." });
  } catch (error) {
    logger.error("DELETE /v1/worklog -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
