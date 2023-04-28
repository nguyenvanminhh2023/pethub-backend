const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: { type: String, required: true },
  province: { type: String, required: true },
  district: { type: String, required: true },
  commune: { type: String, required: true },
  address: { type: String, required: true },
  species: { type: String, enum: ['Chó', 'Mèo', 'Chuột Hamster', 'Khác'], required: true},
  genre: { type: String, enum: ['Đực', 'Cái'] },
  price: { type: Number, required: true },
  weight: { type: Number, required: true },
  age: { type: Number, required: true },
  vaccination: { type: Boolean, required: true },
  description: { type: String },
  images: [{ type: String }],
  isApproved: { type: Boolean, required: true },
  available: { type: Boolean, default: true, required: true },
  endDate: { type: Date, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  reviews: [{
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    rating: { type: Number, required: true },
    message: { type: String }
  }],
  views: { type: Number, required: true, default: 0 }
});

postSchema.virtual('star').get(function () {
  if (this.reviews.length === 0)
    return 0;
  return this.reviews.
    reduce(((accumulator, currentValue) => accumulator + currentValue.rating), 0)
    / this.reviews.length;
});

postSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret, options) {
    ret.id = ret._id;
    delete ret.reviews;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('Post', postSchema);
