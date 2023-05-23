const Messages = require("../models/message.model");

// Lấy danh sách tin nhắn giữa hai người dùng
module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    // Tìm kiếm tất cả các tin nhắn giữa hai người dùng
    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });
    // console.log("🚀 ~ messages:", messages.at(-1));

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
      };
    });

    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

// Thêm tin nhắn mới vào cơ sở dữ liệu
module.exports.addMessage = async (req, res, next) => {
  try {
    // Lấy giá trị của "from", "to" và "message" từ yêu cầu HTTP
    const { from, to, message } = req.body;
    // Tạo bản ghi tin nhắn mới trong cơ sở dữ liệu
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });
    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    // Nếu xảy ra lỗi, chuyển tiếp cho hàm middleware tiếp theo trongchuỗi xử lý
    next(ex);
  }
};
