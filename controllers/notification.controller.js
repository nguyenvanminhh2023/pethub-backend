const Notification = require('../models/notification.model');

const seenNotification = async (req, res, next) => {
  const { notiIds } = req.body;

  try {
    const notifications = await Notification.find({ _id: { $in: notiIds } });
    for (var i = 0; i < notifications.length; i++) {
      notifications[i].seen = true;
      await notifications[i].save();
    }
  } catch (error) {
    console.log(error);
  }
}

exports.seenNotification = seenNotification;