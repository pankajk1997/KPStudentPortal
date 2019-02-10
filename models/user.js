const mongoose = require('mongoose');
const schema = mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    passwd: {
        type: String,
        required: true
    },
    verified: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('user', schema);