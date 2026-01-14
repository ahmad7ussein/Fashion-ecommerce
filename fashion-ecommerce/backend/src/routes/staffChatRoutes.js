"use strict";
const express = require("express");
const { getThreads, getMessages, sendMessage } = require("../controllers/staffChatController");
const { protect } = require("../middleware/auth");
const RoleAssignmentModule = require("../models/RoleAssignment");
const RoleAssignment = RoleAssignmentModule.default || RoleAssignmentModule;

const router = express.Router();

const allowStaffChat = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
  if (["admin", "employee"].includes(req.user.role)) {
    return next();
  }
  const assignment = await RoleAssignment.findOne({
    user: req.user._id,
    role: { $in: ["partner"] },
    status: "active",
  })
    .select("role")
    .lean();
  if (!assignment) {
    return res.status(403).json({
      success: false,
      message: "Not authorized for staff chat",
    });
  }
  req.roleAssignment = assignment;
  next();
};

router.use(protect);
router.use(allowStaffChat);
router.get("/threads", getThreads);
router.get("/messages", getMessages);
router.post("/messages", sendMessage);

module.exports = router;
