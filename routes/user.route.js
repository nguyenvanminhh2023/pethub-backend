const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
    '/register',
    [
        check('username').notEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('role').isIn(['seller', 'buyer']),
        check('phone').isMobilePhone(),
        check('password').isLength({ min: 6 })
    ],
    userController.register
);
router.post('/login', userController.loginWithEmail);
router.get('/login', auth, userController.loginWithToken);
router.get('/notifications', auth, userController.getNotifications);
router.get('/:uid', userController.getUser);
router.put('/:uid', auth, userController.editUser);
router.patch('/:uid/password', auth, userController.editUserPassword);
router.get('/', userController.getUserList);
router.patch('/:uid/approve', auth, userController.approveUser);
router.patch('/favorite', auth, userController.updateFavorite);
router.get('/:uid/favorite', userController.getFavoriteList);
router.get('/:uid/posts', userController.getCreatedPost);
router.post("/chatUsers/:id", userController.getAllChatUsers);

module.exports = router;
