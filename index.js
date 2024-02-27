const express = require("express");
const mongoose = require("mongoose");
const Chatroom = require("./models/Chatroom");
const Message = require("./models/Message");
const http = require("http");
const socketIo = require("socket.io");
const chatroomCleanup = require("./chatroomCleanup");

const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

//Variable to store socket ID mappings
const publicKeyToSocketIdMap = {};

const app = express();

//Remove cors
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow only the React client to connect
    methods: ["GET", "POST"], // Allow only these methods in CORS requests
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected, reason: ${reason}`);
  });
  
  socket.on('register_public_key', (info) => {
    publicKeyToSocketIdMap[info.publicKey] = socket.id;
    console.log(info.chatroom)
    Chatroom.findOne({ Password: info.chatroom })
      .then((result) => {
        if(result){
          console.log(result);
          result.UserPubKeys.forEach((key) => {
            const publicKeyBase64 = key.toString('base64');
            const recipientSocketId = publicKeyToSocketIdMap[publicKeyBase64];
            if (recipientSocketId) {
              // Use Socket.IO to send the message to the recipient's socket
              io.to(recipientSocketId).emit("new_public_keys", {publicKeys: result.UserPubKeys});
            } else {
              console.log(publicKeyToSocketIdMap)
              console.log(`Recipient with public key ${key} not connected.`);
            }
          })
        }
        else{
          console.log("No result")
        }
      })
  });

  socket.on("error", (error) => {
    console.error(`Connection error: ${error}`);
  });
});

const uri =
  "mongodb+srv://AppUser:qvRGUENrpuplSpeT@cpsc559project.uhkbb5v.mongodb.net/CPSC559Project?retryWrites=true&w=majority";

mongoose.connect(uri).then((result) => console.log("connected to db"));
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Listening on port ${port}`));

chatroomCleanup();

//Example for how to call the following endpoint http://localhost:4000/chatrooms
//Endpoint can be used to get all chatrooms
app.get("/chatrooms", async (req, res) => {
  Chatroom.find({})
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

//Example for how to call the following endpoint http://localhost:4000/messages
//Endpoint can be used to get all messages
app.get("/messages", async (req, res) => {
  Message.find({})
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

//Example for how to call the following endpoint http://localhost:4000/chatroom/65d691acb3615c49d737f639/messages
//Endpoint can be used to get all messages for a specific chatroom
app.get("/chatroom/:id/messages", async (req, res) => {
  try {
    const messages = await Message.find({ ChatroomID: req.params.id });
    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Example for how to call the following endpoint http://localhost:4000/message?message=Content&user=Test User&chatroom=65d691acb3615c49d737f639
//Endpoint can be used to send new message data to the db
app.post("/message", async (req, res) => {
  console.log(req.body);
  try {

    //Comment this out for now as it's causing massive type errors
    /*const userPubKeyBase64 = req.body.publicKey;
    const userPubKeyBuffer = Buffer.from(userPubKeyBase64, 'base64');

    const nonceBase64 = req.body.encryptedMessage.nonce;
    const nonceBuffer = Buffer.from(nonceBase64, 'base64');

    const macBase64 = req.body.encryptedMessage.mac;
    const macBuffer = Buffer.from(macBase64, 'base64');*/

    const message = await Message.create({
      CipherText: req.body.encryptedMessage.ciphertext,
      /*nonce: nonceBuffer,
      mac: macBuffer,
      User: userPubKeyBuffer,*/
      ChatroomID: req.body.currChatroom,
    });

    req.body.recipients.forEach((keyPair) => {
      const recipientSocketId = publicKeyToSocketIdMap[keyPair.publicKey];
      if (recipientSocketId) {
        // Use Socket.IO to send the message to the recipient's socket
        io.to(recipientSocketId).emit("new_message", message);
      } else {
        console.log(publicKeyToSocketIdMap)
        console.log(`Recipient with public key ${keyPair.publicKey} not connected.`);
      }
    })
    console.log("Made message");

    //loop across the recipients and broadcast the message to each of them with the appropriate symmetric key
    res.status(200).json(message);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

//Example for how to call the following endpoint http://localhost:4000/chatroom?password=coool
//Endpoint can be used to create a new chatroom and send data to the db
app.post("/chatroom", async (req, res) => {
  console.log(req.body);
  try {
    const userPubKeyBase64 = req.body.userPubKey;
    const userPubKeyBuffer = Buffer.from(userPubKeyBase64, 'base64');
    const chatroom = await Chatroom.create({
      Password: req.body.password,
      UserPubKeys: [userPubKeyBuffer],
    });
    res.status(200).json(chatroom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Example of how to call the following endpoint http://localhost:4000/room?password=coool390
//This endpoint can be called to login a user it will take a password as a parameter and either send back the chatroom id
//or send back a message stating invalid chatroom password
app.get("/room", async (req, res) => {
  Chatroom.findOne({ Password: req.query.Password })
    .then((chatroom) => {
      if (!chatroom) {
        return res.status(400).json({error: "Invalid Chatroom Password"});
      }

      // Ensure publicKey is provided
      if (!req.query.publicKey) {
        return res.status(400).json({error: "Public key is required"});
      }

      // Convert publicKey from a base64 string to a Buffer

      const publicKeyBuffer = Buffer.from(req.query.publicKey, 'base64');

      // Add the publicKey to the UserPubKeys array
      Chatroom.updateOne(
        { _id: chatroom._id },
        { $addToSet: { UserPubKeys: publicKeyBuffer } }
      )
      .then(updateResult => {
        res.status(200).json({password: chatroom.Password});
      })
      .catch(updateError => {
        console.error(updateError);
        res.status(500).json({error: "Failed to add user public key"});
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({error: "An error occurred"});
    });
});