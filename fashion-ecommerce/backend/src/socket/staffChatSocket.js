"use strict";
const jwt = require("jsonwebtoken");
const StaffChatMessage = require("../models/StaffChatMessage");
const UserModule = require("../models/User");
const User = UserModule.default || UserModule;
const envModule = require("../config/env");
const env = envModule.default || envModule.env || envModule;

const getRoomId = (adminId, employeeId) => `staff-chat:${adminId}:${employeeId}`;

const resolveParticipants = async (socketUser, payload) => {
  const isAdmin = socketUser.role === "admin";
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

  const [adminUser, employeeUser] = await Promise.all([
    User.findById(adminId).select("role"),
    User.findById(employeeId).select("role"),
  ]);

  if (!adminUser || adminUser.role !== "admin") {
    throw new Error("Invalid admin user");
  }

  if (!employeeUser || employeeUser.role !== "employee") {
    throw new Error("Invalid employee user");
  }

  return {
    adminId: adminUser._id,
    employeeId: employeeUser._id,
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
      if (!["admin", "employee"].includes(user.role)) {
        return next(new Error("Not authorized"));
      }
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("staff-chat:join", async (payload, callback) => {
      try {
        const { adminId, employeeId } = await resolveParticipants(socket.data.user, payload);
        const roomId = getRoomId(adminId, employeeId);
        socket.join(roomId);

        if (socket.data.user.role === "admin") {
          await StaffChatMessage.updateMany({
            admin: adminId,
            employee: employeeId,
            readByAdmin: false,
            senderRole: "employee",
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
        const { adminId, employeeId } = await resolveParticipants(socket.data.user, payload);
        if (socket.data.user.role === "admin") {
          await StaffChatMessage.updateMany({
            admin: adminId,
            employee: employeeId,
            readByAdmin: false,
            senderRole: "employee",
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

        const { adminId, employeeId } = await resolveParticipants(socket.data.user, payload);
        const roomId = getRoomId(adminId, employeeId);
        socket.join(roomId);

        const createdMessage = await StaffChatMessage.create({
          admin: adminId,
          employee: employeeId,
          sender: socket.data.user._id,
          senderRole: socket.data.user.role,
          message: messageText,
          readByAdmin: socket.data.user.role === "admin",
          readByEmployee: socket.data.user.role === "employee",
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
