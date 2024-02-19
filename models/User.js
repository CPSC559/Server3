const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id:{
        type: String,
        required: true
    },
    Username:{
      type: String,
      required: true  
    },
    Password: {
        type: String,
        required: true
    },
}, {timestampes: true})

const User = mongoose.model('User', userSchema)
module.exports= User;