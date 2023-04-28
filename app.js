const express = require("express");
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const cors = require("cors");

const userRoutes = require('./routes/user.route');
const postRoutes = require('./routes/post.route');

const app = express();
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
    res.json({ message: "Just say Yeah Yeah Yeah!!!" });
});

const uri = process.env.DATABASE_URI;

mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.log(err);
    });

const PORT = process.env.PORT || 5000;
var http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

http.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});

app.use(function (req, res, next) {
    req.io = io;
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
