const express = require('express');

const notificationController = require('../controllers/notification.controller');
const router = express.Router();

router.patch('/seen', notificationController.seenNotification);

module.exports = router;