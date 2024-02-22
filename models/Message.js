const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    MessageContent:{
      type: String,
      required: true  
    },
    User: {
        type: String,
        required: true
    },
    ChatroomID: {
        type: String,
        required: true
    }
}, {timestamps: true, versionKey: false})

const Message = mongoose.model('Message',messageSchema)
module.exports= Message;