const express = require("express");

const router = express.Router();

const FeedbackModel = require("../../models/Feedback");
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
      user: { role, hourlyRate },
    } = token;

    const stats = {};

    if (role === UserRoles.ADMIN) {
      const totalFeedbackReceived = await FeedbackModel.countDocuments({
        tenant: tenantId,
      });

      const worklog = await WorklogModel.find({ tenant: tenantId }).populate(
        "user"
      );

      let totalWorkHours = 0;

      let totalDisbursements = 0;

      worklog.forEach((elem) => {
        totalWorkHours += elem.hours;
        totalDisbursements += elem.hours * elem.user.hourlyRate;
      });

      const organization = {
        totalFeedbackReceived,
        totalWorkHours,
        totalDisbursements,
      };

      stats.organization = organization;
    }

    if (role === UserRoles.MANAGER) {
      const totalFeedbackReceived = await FeedbackModel.countDocuments({
        tenant: tenantId,
        manager: userId,
      });

      const worklog = await WorklogModel.find({
        tenant: tenantId,
        manager: userId,
      }).populate("user");

      let totalWorkHours = 0;

      let totalDisbursements = 0;

      worklog.forEach((elem) => {
        totalWorkHours += elem.hours;
        totalDisbursements += elem.hours * elem.user.hourlyRate;
      });

      const team = {
        totalFeedbackReceived,
        totalWorkHours,
        totalDisbursements,
      };

      stats.team = team;
    }

    const totalFeedbackShared = await FeedbackModel.countDocuments({
      tenant: tenantId,
      user: userId,
    });

    const worklog = await WorklogModel.find({ user: userId });

    let totalHoursWorked = 0;

    worklog.forEach((elem) => {
      totalHoursWorked += elem.hours;
    });

    const personal = {
      totalFeedbackShared,
      totalHoursWorked,
      totalEarnings: totalHoursWorked * hourlyRate,
    };

    stats.personal = personal;

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("POST /v1/stats -> error : ", error);
    return res
      .status(500)
      .json({ success: false, message: INTERNAL_SERVER_ERROR_MESSAGE });
  }
});

module.exports = router;
