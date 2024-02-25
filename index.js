const express = require("express");
const mongoose = require("mongoose");
const Chatroom = require("./models/Chatroom");
const Message = require("./models/Message");
const http = require("http");
const socketIo = require("socket.io");
const chatroomCleanup = require("./chatroomCleanup");

const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

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
    const message = await Message.create({
      CipherText: req.body.encryptedMessage.ciphertext,
      Nonce: req.body.encryptedMessage.nonce,
      MAC: req.body.encryptedMessage.mac,
      User: req.body.publicKey,
      ChatroomID: req.body.currChatroom,
    });
    io.to(req.body.chatroom).emit("new_message", message); // Broadcast the new message to the client(s) connected to the chatroom
    res.status(200).json(message);
  } catch (error) {
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
  Chatroom.find({ Password: req.query.password })
    .then((result) => {
      if (result.length === 0) {
        res.send("Invalid Chatroom Password");
      } else {
        res.send(result[0]._id);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
