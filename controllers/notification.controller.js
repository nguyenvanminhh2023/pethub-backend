const Notification = require('../models/notification.model');

const seenNotification = async (req, res, next) => {
  // const { notiIds } = req.body;

  // try {
  //   const notifications = await Notification.find({ _id: { $in: notiIds } });
  //   for (var i = 0; i < notifications.length; i++) {
  //     notifications[i].seen = true;
  //     await notifications[i].save();
  //   }
  // } catch (error) {
  //   console.log(error);
  // }
  const { notiId } = req.body;

  try {
    const notification = await Notification.findOne({ _id: notiId });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notification.seen = true;
    await notification.save();
    res.status(200).json({ message: "Notification updated successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
}

exports.seenNotification = seenNotification;