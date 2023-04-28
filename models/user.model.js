const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: { type: String, require: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    username: { type: String, required: true },
    isApproved: { type: Boolean, required: true },
    citizen: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    avatar: { type: String },
    favorite: [{ type: mongoose.Types.ObjectId, ref: 'Post' }]
});

userSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret.password;
        delete ret.favorite;
        delete ret._id;
        delete ret.__v;
    }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);