const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    reqIPs: {
        type: Array
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    }
})

const User = mongoose.model('User', userSchema);

module.exports = User;