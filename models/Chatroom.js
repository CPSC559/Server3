const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatroomSchema = new Schema({
    Password: {
        type: String,
        required: true
    },
    UserPubKeys: {
        type: [Buffer]
    }
}, {versionKey: false})

const Chatroom = mongoose.model('Chatroom',chatroomSchema)
module.exports= Chatroom;