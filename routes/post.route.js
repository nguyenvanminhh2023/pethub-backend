const express = require('express');
const { check } = require('express-validator');

const postController = require('../controllers/post.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post(
  '/new',
  [
    check('title').not().isEmpty(),
    check('species').isIn(['Chó', 'Mèo', 'Chuột Hamster', 'Khác']),
    check('genre').isIn(['Đực', 'Cái']),
    check('price').isNumeric({ gt: 0 }),
    check('weight').isNumeric({ gt: 0 }),
    check('age').isNumeric({ gt: 0 }),
  ],
  postController.createPost
);
router.get('/', postController.getPosts);
router.patch('/:pid/approve', postController.approvePost);

module.exports = router;