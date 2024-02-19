const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    _id:{
        type: String,
        required: true
    },
    MessageContent:{
      type: String,
      required: true  
    },
    User: {
        type: String,
        required: true
    },
    ChatroomID: {
        type: Number,
        required: true
    },
    MessageDate: {
        type: Date,
        required: true
    }
}, {timestampes: true})

const Message = mongoose.model('Message',messageSchema)
module.exports= Message;