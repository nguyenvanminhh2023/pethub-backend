const { validationResult } = require('express-validator');

const User = require('../models/user.model');
const Post = require('../models/post.model');
const Notification = require('../models/notification.model');

const createPost = async (req, res, next) => {
  let user;
  try {
    user = await User.findOne({ _id: req.userData.userId });
    if (user.role === 'buyer' || (user.role === 'seller' && !user.isApproved)) {
      res.status(403).send({ message: 'You are not allowed to create new post.' });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Authorization failed, please try again later.' })
    return;
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).send({ message: 'Invalid inputs passed, please check your data.' });
    return;
  }
  const {
    title,
    province,
    district,
    commune,
    address,
    species,
    genre,
    quantity,
    gender,
    price,
    weight,
    age,
    vaccination,
    description,
    images,
    endDate,
    extending
  } = req.body;
  const newPost = new Post({
    title,
    province,
    district,
    commune,
    address,
    species,
    genre,
    quantity,
    gender,
    price,
    weight,
    age,
    vaccination,
    description,
    images,
    endDate,
    extending,
    isApproved: user.role == 'admin',
    creator: req.userData.userId
  });
  try {
    await newPost.save();
  } catch (err) {
    res.status(500).send({ message: 'Database Register failed, please try again later.' });
    return;
  }

  // try {
  //   const notification = new Notification({
  //     type: 'ADMIN',
  //     post: newPost._id
  //   });
  //   await notification.save();
  // }
  // catch {
  // }

  if (user.role !== 'admin') {
    try {
      const notification = new Notification({
        type: 'ADMIN',
        post: newPost._id
      });
      await notification.save();
    }
    catch {
    }
  }
  res.status(201).json({ postId: newPost._id });
}

const getPosts = async (req, res, next) => {
  let posts, postsCount, totalPosts;
  const keyword = req.query.q || '';
  const province = req.query.province || ''; 
  const species = req.query.species || ['Chó', 'Mèo', 'Chim', 'Gà', 'Chuột Hamster', 'Khác'];
  const genre = req.query.genre || '';
  const gender = req.query.gender || ['Đực', 'Cái'];
  const orderBy = req.query.orderBy || '_id';
  const startAge = req.query.startAge || 0;
  const endAge = req.query.endAge || 1000;
  const startWeight = req.query.startWeight || 0;
  const endWeight = req.query.endWeight || 1000;
  const vaccination = req.query.vaccination || [0, 1];
  const startPrice = req.query.startPrice * 1000000 || 0;
  const endPrice = req.query.endPrice * 1000000 || 20000000;
  const order = req.query.order === 'asc' ? '+' : '-';
  const page = req.query.page;
  const available = req.query.page ? [1] : [1, 0];
  const isApproved = req.query.page ? [1] : [1, 0];
  const currentDate = new Date();
  
  try {
    posts = await Post.find({
      title: { $regex: keyword, $options: "i" },
      province: { $regex: province, $options: "i" },
      species: { $in: species },
      genre: { $regex: genre, $options: "i" },
      gender: { $in: gender },
      age: { $gte: startAge, $lte: endAge },
      weight: { $gte: startWeight, $lte: endWeight },
      vaccination: { $in: vaccination },
      price: { $gte: startPrice, $lte: endPrice },
      available: { $in: available },
      isApproved: { $in: isApproved },
      endDate: { $gte: currentDate }
    }).sort(order + orderBy).populate('creator', 'username email avatar id');
    if (orderBy === 'star') {
      posts.sort((a, b) => {
        if (order === '-') {
          return b.star - a.star;
        }
        return a.star - b.star;
      });
    }
    let tempPosts = posts;
    totalPosts = tempPosts.length;
    const perPage = 8;
    if (page) {
      posts = posts.slice((page - 1) * perPage, page * perPage);
    }
    postsCount = posts.length;
  } catch (err) {
    res.status(404).send(
      'Error get posts!!!'
    );
    console.log(err);
    return;
  }

  res.json({
    totalPosts: totalPosts,
    postsCount: postsCount,
    posts: posts.map(post => {
      return {
        id: post._id,
        title: post.title,
        createdDate: post._id.getTimestamp(),
        description: post.description,
        isApproved: post.isApproved,
        available: post.available,
        province: post.province,
        district: post.district,
        commune: post.commune,
        address: post.address,
        price: post.price,
        weight: post.weight,
        species: post.species,
        genre: post.genre,
        quantity: post.quantity,
        gender: post.gender,
        age: post.age,
        vaccination: post.vaccination,
        image: post.images[0],
        star: post.star,
        views: post.views,
        endDate: post.endDate,
        extending: post.extending,
        creator: {
          username: post.creator.username,
          email: post.creator.email,
          avatar: post.creator.avatar,
          id: post.creator._id
        }
      }
    })
  });
}

const getPostById = async (req, res, next) => {
  const postId = req.params.pid;

  let post, creator;

  try {
    post = await Post.findById(postId);
    creator = await User.findById(post.creator);
  } catch (err) {
    res.status(500).send({ message: 'Something went wrong, could not find a post.' });
    console.log(err);
    return;
  }

  if (!post) {
    res.status(404).send({ message: 'Could not find post for the provided id.' })
    return;
  }

  if (post.isApproved) {
    post.views += 1;
    post.save();
  }
  // post.views += 1;

  res.json(
    {
      post: post.toJSON(),
      creator: {
        id: creator._id,
        username: creator.username,
        address: creator.address,
        email: creator.email,
        phone: creator.phone,
        avatar: creator.avatar
      }
    }
  );
}

const approvePost = async (req, res, next) => {
  const { userId } = req.userData;
  const { pid } = req.params;
  try {
    const user = await User.findOne({ _id: userId });
    if (user.role !== 'admin') {
      res.status(403).json('You cannot approve this user');
      return;
    }
    const post = await Post.findOne({ _id: pid });
    post.isApproved = true;
    await post.save();
    try {
      const notification = new Notification({
        type: 'APPROVED',
        post: post._id
      });
      await notification.save();
    }
    catch {
    }
    res.json({ message: 'Approved!' });
  }
  catch {
    res.status(500).json({ message: 'Cannot approve, please try again' });
  };
}

const postReview = async (req, res, next) => {
  const postId = req.params.pid;
  const review = req.body.review;
  var fs = require("fs");
  var text = fs.readFileSync("../pethub-backend/badword.txt", "utf-8");
  var badword = text.split(" ");
  badword.pop();
  console.log(badword);
  if (!postId) {
    res.status(401).send({ message: 'Invalid post ID' });
    return;
  }
  try {
    const post = await Post.findById(postId);
    let existingReview = post.reviews.filter(value => value.creator == review.creator);
    if (existingReview.length !== 0) {
      res.status(409).json({ message: 'Already reviewed' });
      return;
    }
    var resString1 = '';
    var res1 = review.message.split(' ');
    var flag = false;
    for (let i = 0; i < badword.length; i++) {
      for (let k = 0; k < res1.length; k++) {
        let resString = '';
        for (let j = 0; j < badword[i].length; j++) {
          resString += '*';
        }
        let temp = res1[k].toLowerCase();
        temp == badword[i] ? flag=true : temp = "";
      }
    }
    // for (let j = 0; j < res1.length; j++) {
    //   resString1 += res1[j];
    //   resString1 += ' '
    // }
    if(flag) {
      review.isBad = true;
      post.reviews.push(review);
      await post.save();
    } else {
      var spawn = require('child_process').spawn;
      var process = spawn('python', [
        './spam.py',
        review.message.toString()
      ])
      process.stdout.on('data', async function(data) {
        console.log(data);
        console.log(data.toString());
        if (data.toString().includes('isBad')) {
          console.log("isBad")
          review.isBad = true;
        } else {
          console.log("isNotBad")
          review.isBad = false;
        }
        post.reviews.push(review);
        await post.save();
        res.status(201).json({ message: 'Review Successfully' });
      })
      process.on('close',  (code) => {
        console.log("code", code);
      })
    }
   // review.message = resString1;
    
    // post.reviews.push(review);
    // await post.save();
    // res.status(201).json({ message: 'Review Successfully' });
  }
  catch (error) {
    console.log(error);
    res.status(404).json({ message: 'Cannot find post' });
  }
}

const getReviews = async (req, res, next) => {
  const postId = req.params.pid;
  if (!postId) {
    res.status(401).send({ message: 'Cannot get post ID' });
    return;
  }
  try {
    const post = await Post.findById(postId).populate('reviews.creator', 'username avatar id');
    res.status(200).json({
      reviews: post.reviews.map(review => {
        return {
          id: review._id,
          rating: review.rating,
          message: review.message,
          createdAt: review._id.getTimestamp(),
          creator: {
            username: review.creator.username,
            avatar: review.creator.avatar,
            id: review.creator._id
          },
          isBad: review.isBad
        }
      })
    });
  }
  catch (error) {
    res.status(404).json({ message: 'Cannot find post' });
  }
}

const editPost = async (req, res, next) => {
  let user, post;
  const { pid } = req.params;
  try {
    user = await User.findOne({ _id: req.userData.userId });
    post = await Post.findOne({ _id: pid });
    if (!(user.role === 'admin' || post.creator.equals(user._id))) {
      res.status(403).send({ message: 'You are not allowed to edit this post.' });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Authorization failed, please try again later.' })
    return;
  }

  try {
    const session = await Post.startSession();
    session.startTransaction();

    const {
      title,
      species,
      genre,
      quantity,
      price,
      weight,
      age,
      gender,
      vaccination,
      description,
      province,
      district,
      commune,
      address,
      images
    } = req.body;

    post.title = title;
    post.species = species;
    post.genre = genre;
    post.quantity = quantity;
    post.price = price;
    post.weight = weight;
    post.age = age;
    post.gender = gender;
    post.vaccination = vaccination;
    post.description = description;
    post.province = province;
    post.district = district;
    post.commune = commune;
    post.address = address;
    post.images = images;

    await post.save();

    session.endSession();
    res.status(200).json({ message: 'Update successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Authorization failed, please try again later.' });
    return;
  }

}

const extendPost = async (req, res, next) => {
  const { extendDate, pid } = req.body;
  console.log(req.body);
  console.log(req.userData.userId);

  try {
    const user = await User.findOne({ _id: req.userData.userId });
    const post = await Post.findOne({ _id: pid });
    
    if (user.role === 'admin') {
      post.endDate = extendDate;
      post.extending = false;
      await post.save();
      const creator = await User.findOne({ _id: post.creator });
      console.log(post.creator);
      if (creator.role !== 'admin') {
        try {
          const notification = new Notification({
            type: 'EXTENDAPPROVED',
            post: post._id
          });
          await notification.save();
          res.status(201).json({ message: 'Thành công (admin)' })
        }
        catch (err) {
          console.log(err);
          console.log("error line 369")
        }
      } else {
        res.status(201).json({ message: 'Thành công (admin)' });
      }
    } else {
      try {
        const notification = new Notification({
          type: 'EXTENDPOST',
          post: post._id,
          extendDate: extendDate
        });
        await notification.save();
        post.extending = true;
        await post.save();
        res.status(201).json({ message: 'Thành công (seller)' })
      }
      catch (err) {
        console.log(err);
        console.log("error line 382")
      }
    }
  } catch (err) {
    console.log(err);
    console.log("error line 386")
  }
}

const setUnAvailablePost = async (req, res, next) => {
  const { userId } = req.userData;
  const { pid } = req.params;
  try {
    const user = await User.findOne({ _id: userId });
    const post = await Post.findOne({ _id: pid });
    if (!(user.role === 'admin' || post.creator !== user.id)) {
      res.status(403).json('You cannot set available this post');
      return;
    }
    post.available = false;
    await post.save();
    const notification = new Notification({
      type: 'UNAVAILABLE',
      post: post._id
    });
    await notification.save();
    res.json({ message: 'Success' });
  } catch {
    res.status(500).json({ message: 'Cannot activate, please try again' });
  }
}

exports.createPost = createPost;
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.approvePost = approvePost;
exports.editPost = editPost;
exports.postReview = postReview;
exports.getReviews = getReviews;
exports.extendPost = extendPost;
exports.setUnAvailablePost = setUnAvailablePost;
