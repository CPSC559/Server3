const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    // Serialized encrypted message
    Cipher: {
      type: String,
      required: true,
    },
    Sender: {
      // Base64 public key, representing the user who sent the message
      type: String,
      required: false,
    },
    ChatroomID: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
