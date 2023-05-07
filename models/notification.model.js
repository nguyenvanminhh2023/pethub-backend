const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    type: { type: String, enum: ['ADMIN', 'APPROVED', 'UNAVAILABLE', 'EXTENDPOST', 'EXTENDAPPROVED'], required: true },
    post: { type: mongoose.Types.ObjectId, ref: 'Post', required: true },
    seen: { type: Boolean, default: false, required: true},
    extendDate: { type: Date }
});

notificationSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

module.exports = mongoose.model('Notification', notificationSchema);
