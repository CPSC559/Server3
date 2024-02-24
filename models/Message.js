const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    CipherText:{ //this is the message
      type: String,
      required: true  
    },
    Nonce:{
        type: String,
        required: true,
    },
    MAC:{
        type: String,
        required: true,
    },
    User: { //this is a public key, representing the user who sent the message
        type: String,
        required: true
    },
    ChatroomID: {
        type: String,
        required: true
    },
    
}, {timestamps: true, versionKey: false})

const Message = mongoose.model('Message',messageSchema)
module.exports= Message;