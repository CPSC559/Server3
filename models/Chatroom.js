const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatroomSchema = new Schema({
    _id:{
        type: String,
        required: true
    },
    Chatroom: {
        type: Number,
        required: true
    },
    CurrentUsers: {
        type: Number,
        required: true
    },
    LastMessage: {
        type: Date,
        required: true
    },
}, {timestampes: true})

const Chatroom = mongoose.model('Chatroom',chatroomSchema)
module.exports= Chatroom;