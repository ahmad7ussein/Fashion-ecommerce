"use strict";
const express = require("express");
const { getThreads, getMessages, sendMessage } = require("../controllers/staffChatController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/threads", authorize("admin", "employee"), getThreads);
router.get("/messages", authorize("admin", "employee"), getMessages);
router.post("/messages", authorize("admin", "employee"), sendMessage);

module.exports = router;
