"use strict";
const jwt = require("jsonwebtoken");
const StaffChatMessage = require("../models/StaffChatMessage");
const UserModule = require("../models/User");
const RoleAssignmentModule = require("../models/RoleAssignment");
const User = UserModule.default || UserModule;
const RoleAssignment = RoleAssignmentModule.default || RoleAssignmentModule;
const envModule = require("../config/env");
const env = envModule.default || envModule.env || envModule;

const getRoomId = (adminId, employeeId) => `staff-chat:${adminId}:${employeeId}`;

const resolveChatRole = async (user) => {
  if (!user) {
    return null;
  }
  if (user.role === "admin" || user.role === "employee") {
    return user.role;
  }
  const assignment = await RoleAssignment.findOne({
    user: user._id,
    role: { $in: ["partner"] },
    status: "active",
  })
    .select("role")
    .lean();
  return assignment?.role || null;
};

const resolveCounterpart = async (userId) => {
  if (!userId) {
    return null;
  }
  const user = await User.findById(userId).select("role");
  if (!user) {
    return null;
  }
  if (user.role === "employee") {
    return user._id;
  }
  const assignment = await RoleAssignment.findOne({
    user: user._id,
    role: { $in: ["partner"] },
    status: "active",
  })
    .select("_id")
    .lean();
  return assignment ? user._id : null;
};

const resolveParticipants = async (socketUser, payload, chatRole) => {
  const isAdmin = chatRole === "admin";
  let adminId = isAdmin ? socketUser._id : payload?.adminId;
  let employeeId = isAdmin ? payload?.employeeId : socketUser._id;

  if (isAdmin && !employeeId) {
    throw new Error("employeeId is required");
  }

  if (!isAdmin && !adminId) {
    const defaultAdmin = await User.findOne({ role: "admin" }).select("_id");
    adminId = defaultAdmin?._id;
  }

  if (!adminId) {
    throw new Error("No admin available");
  }

  const [adminUser, counterpartId] = await Promise.all([
    User.findById(adminId).select("role"),
    resolveCounterpart(employeeId),
  ]);

  if (!adminUser || adminUser.role !== "admin") {
    throw new Error("Invalid admin user");
  }

  if (!counterpartId) {
    throw new Error("Invalid staff user");
  }

  return {
    adminId: adminUser._id,
    employeeId: counterpartId,
  };
};

const setupStaffChatSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.split(" ")[1]
        || socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Not authorized"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("User not found"));
      }
      const chatRole = await resolveChatRole(user);
      if (!chatRole) {
        return next(new Error("Not authorized"));
      }
      socket.data.user = user;
      socket.data.chatRole = chatRole;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("staff-chat:join", async (payload, callback) => {
      try {
        const { adminId, employeeId } = await resolveParticipants(
          socket.data.user,
          payload,
          socket.data.chatRole
        );
        const roomId = getRoomId(adminId, employeeId);
        socket.join(roomId);

        if (socket.data.chatRole === "admin") {
          await StaffChatMessage.updateMany({
            admin: adminId,
            employee: employeeId,
            readByAdmin: false,
            senderRole: { $ne: "admin" },
          }, { $set: { readByAdmin: true } });
        } else {
          await StaffChatMessage.updateMany({
            admin: adminId,
            employee: employeeId,
            readByEmployee: false,
            senderRole: "admin",
          }, { $set: { readByEmployee: true } });
        }

        if (callback) {
          callback({ success: true, roomId });
        }
      } catch (error) {
        if (callback) {
          callback({ error: error.message || "Failed to join chat" });
        }
      }
    });

    socket.on("staff-chat:mark-read", async (payload) => {
      try {
        const { adminId, employeeId } = await resolveParticipants(
          socket.data.user,
          payload,
          socket.data.chatRole
        );
        if (socket.data.chatRole === "admin") {
          await StaffChatMessage.updateMany({
            admin: adminId,
            employee: employeeId,
            readByAdmin: false,
            senderRole: { $ne: "admin" },
          }, { $set: { readByAdmin: true } });
        } else {
          await StaffChatMessage.updateMany({
            admin: adminId,
            employee: employeeId,
            readByEmployee: false,
            senderRole: "admin",
          }, { $set: { readByEmployee: true } });
        }
      } catch (error) {
        // Ignore mark-read errors to avoid interrupting the socket.
      }
    });

    socket.on("staff-chat:send", async (payload, callback) => {
      try {
        const messageText = typeof payload?.message === "string" ? payload.message.trim() : "";
        if (!messageText) {
          throw new Error("Message is required");
        }

        const { adminId, employeeId } = await resolveParticipants(
          socket.data.user,
          payload,
          socket.data.chatRole
        );
        const roomId = getRoomId(adminId, employeeId);
        socket.join(roomId);

        const createdMessage = await StaffChatMessage.create({
          admin: adminId,
          employee: employeeId,
          sender: socket.data.user._id,
          senderRole: socket.data.chatRole,
          message: messageText,
          readByAdmin: socket.data.chatRole === "admin",
          readByEmployee: socket.data.chatRole !== "admin",
        });

        const populated = await StaffChatMessage.findById(createdMessage._id)
          .populate("sender", "firstName lastName email role")
          .lean();

        io.to(roomId).emit("staff-chat:message", populated);

        if (callback) {
          callback({ success: true, data: populated });
        }
      } catch (error) {
        if (callback) {
          callback({ error: error.message || "Failed to send message" });
        }
      }
    });
  });
};

module.exports = setupStaffChatSocket;
