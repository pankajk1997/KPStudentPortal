const mongoose = require('mongoose');
const schema1 = mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    link:{
        type: String,
        required: true
    },
    thumb:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    }
});

mongoose.model('media',schema1);