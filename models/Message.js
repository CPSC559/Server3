const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    CipherText:{ //this is the message
      type: String,
      required: true  
    },
    Nonce:{
        type: String,
        required: false,
    },
    MAC:{
        type: String,
        required: false,
    },
    User: { //this is a public key, representing the user who sent the message
        type: String,
        required: false
    },
    ChatroomID: {
        type: String,
        required: true
    },
    
}, {timestamps: true, versionKey: false})

const Message = mongoose.model('Message',messageSchema)
module.exports= Message;