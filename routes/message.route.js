const express = require("express");

const chatController = require("../controllers/message.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.post("/addmsg/", chatController.addMessage);
router.post("/getmsg/", chatController.getMessages);

module.exports = router;