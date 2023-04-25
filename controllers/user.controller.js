const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');

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
        res.status(422).send({ message: 'User already exists.' });
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
    }
    if (!existingUser) {
        res.status(403).send({ message: 'Invalid, could not log you in.' });
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
        res.status(403).send({ message: 'Invalid, could not log you in.' })
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
        return res.status(401).send({ message: 'Cannot get user' });
    }
}

const getUserList = async (req, res, next) => {
    try {
        const users = await User.find();

        res.status(200).json({
            users: users.map(user => user.toJSON())
        });
    } catch (error) {
        return res.status(401).send({ message: 'Cannot get user' });
    }
}

const approveUser = async (req, res, next) => {
    const { userId } = req.userData;
    const { uid } = req.params;
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

exports.register = register;
exports.loginWithEmail = loginWithEmail;
exports.loginWithToken = loginWithToken;
exports.getUserList = getUserList;
exports.getUser = getUser;
exports.approveUser = approveUser;