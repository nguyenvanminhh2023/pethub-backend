const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const socket = require("socket.io");

const userRoutes = require("./routes/user.route");

const chatRoutes = require("./routes/message.route");

const postRoutes = require("./routes/post.route");
const notificationRoutes = require("./routes/notification.route");

const app = express();
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api", (req, res) => {
  res.json({ message: "Just say Yeah Yeah Yeah!!!" });
});

const uri = process.env.DATABASE_URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

const PORT = process.env.PORT || 5001;
app.use("/api/users", userRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/posts", postRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});

const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

global.onlineUsers = new Map();

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    console.log("🚀 ~ add-user:", userId);
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    console.log("🚀 ~ send-msg:", data.to);
    const sendUserSocket = onlineUsers.get(data.to);
    // nếu user này online
    if (sendUserSocket) {
      console.log("🚀 ~ sendUserSocket:", sendUserSocket);
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});