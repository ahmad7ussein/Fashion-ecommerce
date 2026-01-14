"use strict";
const mongoose = require("mongoose");

const staffChatMessageSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["admin", "employee", "partner"],
    required: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: 2000,
  },
  readByAdmin: {
    type: Boolean,
    default: false,
  },
  readByEmployee: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

staffChatMessageSchema.index({ admin: 1, employee: 1, createdAt: -1 });
staffChatMessageSchema.index({ admin: 1, readByAdmin: 1, createdAt: -1 });
staffChatMessageSchema.index({ employee: 1, readByEmployee: 1, createdAt: -1 });

module.exports = mongoose.model("StaffChatMessage", staffChatMessageSchema);
