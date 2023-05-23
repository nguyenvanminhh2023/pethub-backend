const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const Post = require('../models/post.model');
const Notification = require('../models/notification.model');
const Messages = require('../models/message.model');

const register = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).send({ message: 'Invalid, please check your input.' });
        return;
    }

    const {
        email,
        password,
        role,
        username,
        citizen, 
        address, 
        phone
    } = req.body

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        res.status(500).send({ message: 'Register failed, please try again later.' });
        return;
    }
    if (existingUser) {
        res.status(422).send({ message: 'Tài khoản đã tồn tại.' });
        return;
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
        res.status(500).send({ message: 'Register failed, please try again later.' });
        return;
    }

    const newUser = new User({
        email,
        password: hashedPassword,
        role,
        username,
        isApproved: (role == "buyer"),
        citizen,
        address,
        phone
    });
    try {
        await newUser.save();
    } catch (err) {
        res.status(500).send({ message: 'Database Register failed, please try again later.' });
        console.log(err);
        return;
    }

    let token;
    try {
        token = jwt.sign(
            { userId: newUser.id },
            process.env.SECRET,
            { expiresIn: '1d' }
        );
    } catch (err) {
        res.status(500).send({ message: 'Signing up failed, please try again later.' });
        return;
    }
    res
        .status(201)
        .json({
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                username: newUser.username,
                isApproved: newUser.isApproved,
                citizen: newUser.citizen,
                address: newUser.address,
                phone: newUser.phone,
                avatar: newUser.avatar,
            }, 
            accessToken: token
        });
}

const loginWithEmail = async(req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        res.status(500).send({ message: 'Log in failed, please try again later.' });
        console.log(err);
    }
    if (!existingUser) {
        res.status(404).send({ message: 'Tài khoản không tồn tại.' });
        return;
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        res.status(500).send({ message: 'Could not log you in.' });
        return;
    }
    if (!isValidPassword) {
        res.status(403).send({ message: 'Sai mật khẩu.' });
        return;
    }

    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id },
            process.env.SECRET,
            { expiresIn: '1d' }
        );
    } catch (err) {
        res.status(500).send({ message: 'Log in failed, please try again later.' });
        console.log(err);
        return;
    }

    res
        .status(200)
        .json({
            user: {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
                username: existingUser.username, 
                isApproved: existingUser.isApproved,
                citizen: existingUser.citizen,
                address: existingUser.address,
                phone: existingUser.phone,
                avatar: existingUser.avatar,
            }, 
            accessToken: token
        });
}

const loginWithToken = async (req, res, next) => {
    try {
        const existingUser = await User.findOne({ _id: req.userData.userId });

        return res.status(200).json({
            user: {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
                username: existingUser.username,
                isApproved: existingUser.isApproved,
                citizen: existingUser.citizen,
                address: existingUser.address,
                phone: existingUser.phone,
                avatar: existingUser.avatar,
            }
        });
    } catch (error) {
        return res.status(401).send({ message: 'Invalid authorization token' });
    }
}

const getUser = async (req, res, next) => {
    try {
        const userId = req.params.uid;

        const existingUser = await User.findOne({ _id: userId });

        return res.status(200).json({
            user: existingUser
        });
    } catch (error) {
        console.log(error);
        return res.status(401).send({ message: 'Cannot get user' });
    }
}

const editUser = async (req, res, next) => {
    let user, requestingUser;
    const { uid } = req.params;
    try {
        user = await User.findOne({ _id: uid });
        requestingUser = await User.findOne({ _id: req.userData.userId });
        if (!(requestingUser.role === 'admin' || req.userData.userId == user._id)) {
            res.status(403).send({ message: 'You are not able to edit user profile.' });
            return;
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Authorization failed, please try again later.' })
        return;
    }

    try {
        const session = await User.startSession();
        session.startTransaction();

        const { username, citizen, address, phone } = req.body;
        user.username = username; user.citizen = citizen;
        user.address = address;
        user.phone = phone;
        await user.save();

        session.endSession();
        res.status(200).json({ message: 'Update successfully' });
    }
    catch (err) {
        res.status(500).send({ message: 'Authorization failed, please try again later.' })
        return;
    }
}

const editUserPassword = async (req, res, next) => {
    let user, requestingUser;
    const { uid } = req.params;
    try {
        user = await User.findOne({ _id: uid });
        requestingUser = await User.findOne({ _id: req.userData.userId });
        if (!(requestingUser.role === 'admin' || req.userData.userId == user._id)) {
            res.status(403).send({ message: 'You are not able to edit user password.' });
            return;
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Authorization failed, please try again later.' })
        return;
    }

    try {
        const session = await User.startSession();
        session.startTransaction();

        const { oldPassword, newPassword } = req.body;

        let isValidPassword = false;
        try {
            isValidPassword = await bcrypt.compare(oldPassword, user.password);
        } catch (err) {
            res.status(500).send({ message: 'Auth failed' });
            return;
        }
        if (!isValidPassword) {
            res.status(403).send({ message: 'Invalid old password.' })
            return;
        } else {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }
    
        
        await user.save();

        session.endSession();
        res.status(200).json({ message: 'Update successfully' });
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Authorization failed, please try again later1.' })
        return;
    }
}


const getUserList = async (req, res, next) => {
    try {
        const users = await User.find();

        res.status(200).json({
            users: users.map(user => user.toJSON())
        });
    } catch (error) {
        console.log(error);
        return res.status(401).send({ message: 'Cannot get user' });
    }
}

const approveUser = async (req, res, next) => {
    const { userId } = req.userData;
    const { uid } = req.params;
    console.log(req.body);
    try {
        const existingUser = await User.findOne({ _id: userId });
        if (existingUser.role !== 'admin') {
            res.status(403).json(`You cannot approve this user`);
            return;
        }
        const requestingUser = await User.findOne({ _id: uid });
        requestingUser.isApproved = true;
        await requestingUser.save();
        res.status(200).json({ message: 'Approved' });
    }
    catch {
        res.status(500).json({ message: 'Cannot approve, please try again' });
    };
}

const updateFavorite = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        res.status(401).send({ message: 'Authorization token missing' });
    }

    const { postId } = req.body;

    try {
        const accessToken = authorization.split(' ')[1];

        const { userId } = jwt.verify(accessToken, process.env.SECRET);

        const existingUser = await User.findOne({ _id: userId });

        if (existingUser.favorite.includes(postId))
            existingUser.favorite = existingUser.favorite.filter(item => item != postId);
        else
            existingUser.favorite.push(postId);
        await existingUser.save();
        res.status(201).json({ message: "Updated favorite list" });
    } catch (error) {
        return res.status(500).send({ message: 'Cannot update favorite list' });
    }
}

const getFavoriteList = async (req, res, next) => {
    try {
        const userId = req.params.uid;

        const existingUser = await User.findOne({ _id: userId })
            .populate({
                path: 'favorite',
                populate: {
                    path: 'creator',
                    select: 'username avatar id'
                }
            })

        return res.status(200).json({
            user: {
                id: existingUser._id,
                posts: existingUser.favorite.map(post => {
                    return {
                        id: post._id,
                        title: post.title,
                        createdDate: post._id.getTimestamp(),
                        description: post.description,
                        address: post.address,
                        price: post.price,
                        species: post.species,
                        image: post.images[0],
                        star: post.star,
                        views: post.views,
                        age: post.age,
                        creator: post.creator
                    }
                })
            }
        });
    } catch (error) {
        return res.status(404).send({ message: 'Invalid userID' });
    }
}

const getCreatedPost = async (req, res, next) => {
    try {
        const userId = req.params.uid;

        const posts = await Post.find({ creator: userId })
            .populate('creator', 'id username avatar');

        return res.status(200).json({
            user: {
                id: userId,
                posts: posts.map(post => {
                    return {
                        id: post._id,
                        title: post.title,
                        createdDate: post._id.getTimestamp(),
                        description: post.description,
                        address: post.address,
                        price: post.price,
                        species: post.species,
                        image: post.images[0],
                        star: post.star,
                        views: post.views,
                        age: post.age,
                        creator: post.creator
                    }
                })
            }
        });
    } catch (error) {
        return res.status(404).send({ message: 'Invalid userID' });
    }
}

const getNotifications = async (req, res, next) => {
    const { userId } = req.userData;
    let user;
    try {
        user = await User.findOne({ _id: userId });
    }
    catch {
        res.status(401).json({ message: 'Authorization failed' });
        return;
    }

    const notifications = await Notification
        .find({ type: { $in: ['APPROVED', 'UNAVAILABLE', 'EXTENDAPPROVED'] } })
        .populate('post')

    let response = [];
    notifications.forEach((notification) => {
        if (notification.post.creator.equals(user._id) || user.favorite.includes(notification.post.id)) {
            response.unshift({
                id: notification._id,
                type: notification.type,
                post: notification.post.id,
                title: notification.post.title,
                seen: notification.seen
            })
        }
    });

    if (user.role === 'admin') {
        const notifications = await Notification
            .find({ type: { $in: ['ADMIN', 'EXTENDPOST'] } }).populate('post');;
        notifications.forEach((notification) => {
            response.unshift({
                id: notification._id,
                type: notification.type,
                post: notification.post.id,
                title: notification.post.title,
                seen: notification.seen,
                extendDate: notification.extendDate
            })
        });
    }

    response.sort(function (a, b) {
        return b.id - a.id;
    });

    res.status(200).json({ notifications: response });
}

const getAllChatUsers = async (req, res, next) => {
    try {
      haveId = false;
      const { idChatUser } = req.body;
      if (idChatUser) {
        haveId = true;
      }
  
      // ngoại trừ user có id trong params
      let users = await User.find({ _id: { $ne: req.params.id } }).select([
        "email",
        "username",
        "_id",
      ]);
      const from = req.params.id;
      const usersWithLastMess = [];
  
      for (const user of users) {
        const messages = await Messages.find({
          users: {
            $all: [from, user.id],
          },
        })
          .sort({ updatedAt: 1 })
          .select(["message"]);
        const lastMess =
          messages.length > 0 ? messages[messages.length - 1].message.text : null;
        usersWithLastMess.push({
          username: user.username,
          id: user.id,
          email: user.email,
          lastMess,
        });
      }
      const filteredUsers = usersWithLastMess.filter((user) => {
        return (haveId && idChatUser === user.id) || user.lastMess !== null;
      });
      return res.json(filteredUsers);
      // return res.json(users);
    } catch (ex) {
      next(ex);
    }
};

exports.register = register;
exports.loginWithEmail = loginWithEmail;
exports.loginWithToken = loginWithToken;
exports.getUserList = getUserList;
exports.getUser = getUser;
exports.editUser = editUser;
exports.editUserPassword = editUserPassword;
exports.approveUser = approveUser;
exports.updateFavorite = updateFavorite;
exports.getFavoriteList = getFavoriteList;
exports.getCreatedPost = getCreatedPost;
exports.getNotifications = getNotifications;
exports.getAllChatUsers = getAllChatUsers;