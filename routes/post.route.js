const express = require('express');
const { check } = require('express-validator');

const postController = require('../controllers/post.controller');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', postController.getPosts);
router.get('/:pid', postController.getPostById);
router.get('/:pid/review', postController.getReviews);

router.use(auth);

router.post(
  '/new',
  [
    check('title').not().isEmpty(),
    check('species').isIn(['Chó', 'Mèo', 'Chuột Hamster', 'Khác']),
    check('gender').isIn(['Đực', 'Cái']),
    check('price').isNumeric({ gt: 0 }),
    check('weight').isNumeric({ gt: 0 }),
    check('age').isNumeric({ gt: 0 }),
  ],
  postController.createPost
);

router.post('/:pid/review', postController.postReview);
router.patch('/:pid/approve', postController.approvePost);

module.exports = router;