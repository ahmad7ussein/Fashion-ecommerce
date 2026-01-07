"use strict";
const StaffChatMessage = require("../models/StaffChatMessage");
const UserModule = require("../models/User");
const User = UserModule.default || UserModule;

const summarizeUser = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
});

const getThreads = async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "admin" && role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Not authorized for staff chat",
      });
    }
    const isAdmin = role === "admin";
    const counterpartRole = isAdmin ? "employee" : "admin";
    const counterparts = await User.find({ role: counterpartRole })
      .select("firstName lastName email role")
      .lean();
    if (!counterparts.length) {
      return res.status(200).json({ success: true, data: [] });
    }
    const counterpartIds = counterparts.map((user) => user._id);
    const match = isAdmin
      ? { admin: req.user._id, employee: { $in: counterpartIds } }
      : { employee: req.user._id, admin: { $in: counterpartIds } };
    const messages = await StaffChatMessage.find(match)
      .sort({ createdAt: -1 })
      .lean();
    const threadStats = new Map();
    messages.forEach((message) => {
      const counterpartId = (isAdmin ? message.employee : message.admin).toString();
      let entry = threadStats.get(counterpartId);
      if (!entry) {
        entry = { lastMessage: message, unreadCount: 0 };
        threadStats.set(counterpartId, entry);
      }
      if (isAdmin) {
        if (!message.readByAdmin && message.senderRole === "employee") {
          entry.unreadCount += 1;
        }
      } else if (!message.readByEmployee && message.senderRole === "admin") {
        entry.unreadCount += 1;
      }
    });
    const currentUser = summarizeUser(req.user);
    const threads = counterparts.map((counterpart) => {
      const key = counterpart._id.toString();
      const stats = threadStats.get(key);
      return {
        id: key,
        admin: isAdmin ? currentUser : summarizeUser(counterpart),
        employee: isAdmin ? summarizeUser(counterpart) : currentUser,
        lastMessage: stats
          ? {
              message: stats.lastMessage.message,
              createdAt: stats.lastMessage.createdAt,
              senderRole: stats.lastMessage.senderRole,
            }
          : null,
        unreadCount: stats ? stats.unreadCount : 0,
      };
    });
    res.status(200).json({ success: true, data: threads });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const employeeId = isAdmin ? req.query.employeeId : req.user._id;
    let adminId = isAdmin ? req.user._id : req.query.adminId;
    if (isAdmin && !employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }
    if (!isAdmin && !adminId) {
      const defaultAdmin = await User.findOne({ role: "admin" }).select("_id");
      adminId = defaultAdmin?._id;
    }
    if (!adminId) {
      return res.status(404).json({
        success: false,
        message: "No admin available",
      });
    }
    const [adminUser, employeeUser] = await Promise.all([
      User.findById(adminId).select("role firstName lastName email"),
      User.findById(employeeId).select("role firstName lastName email"),
    ]);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Invalid admin user",
      });
    }
    if (!employeeUser || employeeUser.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee user",
      });
    }
    const messages = await StaffChatMessage.find({
      admin: adminUser._id,
      employee: employeeUser._id,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email role")
      .lean();
    if (isAdmin) {
      await StaffChatMessage.updateMany({
        admin: adminUser._id,
        employee: employeeUser._id,
        readByAdmin: false,
        senderRole: "employee",
      }, { $set: { readByAdmin: true } });
    } else {
      await StaffChatMessage.updateMany({
        admin: adminUser._id,
        employee: employeeUser._id,
        readByEmployee: false,
        senderRole: "admin",
      }, { $set: { readByEmployee: true } });
    }
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const messageText = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }
    const isAdmin = req.user.role === "admin";
    let adminId;
    let employeeId;
    if (isAdmin) {
      adminId = req.user._id;
      employeeId = req.body.employeeId;
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is required",
        });
      }
    } else {
      employeeId = req.user._id;
      adminId = req.body.adminId;
      if (!adminId) {
        const defaultAdmin = await User.findOne({ role: "admin" }).select("_id");
        adminId = defaultAdmin?._id;
      }
      if (!adminId) {
        return res.status(404).json({
          success: false,
          message: "No admin available",
        });
      }
    }
    const [adminUser, employeeUser] = await Promise.all([
      User.findById(adminId).select("role"),
      User.findById(employeeId).select("role"),
    ]);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Invalid admin user",
      });
    }
    if (!employeeUser || employeeUser.role !== "employee") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee user",
      });
    }
    const createdMessage = await StaffChatMessage.create({
      admin: adminUser._id,
      employee: employeeUser._id,
      sender: req.user._id,
      senderRole: isAdmin ? "admin" : "employee",
      message: messageText,
      readByAdmin: isAdmin,
      readByEmployee: !isAdmin,
    });
    const populated = await StaffChatMessage.findById(createdMessage._id)
      .populate("sender", "firstName lastName email role")
      .lean();
    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.getThreads = getThreads;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
