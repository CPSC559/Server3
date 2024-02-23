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

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow only the React client to connect
    methods: ["GET", "POST"], // Allow only these methods in CORS requests
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("send_message", async (data) => {

    const { message, user, chatroom } = data;
    console.log(`Message received: ${message} from ${user} for chatroom ${chatroom}`);
    try {
      const message = await Message.create({
        MessageContent: message,
        User: user,
        ChatroomID: chatroom,
      });
      io.to(chatroom).emit("new_message", message); // Broadcast the new message to the client(s) connected to the chatroom
      res.status(200).json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }    
  });
  
  socket.on("join_chatroom", async ({ chatroomID, password }) => {
    console.log(`Socket ${socket.id} requesting to join chatroom ${chatroomID} with password`);

    // Verify chatroom password
    try {
      const chatroom = await Chatroom.findOne({ _id: chatroomID });
      if (chatroom && chatroom.Password === password) {
        // Password is correct, join the chatroom
        socket.join(chatroomID);
        console.log(`Socket ${socket.id} joined chatroom ${chatroomID}`);
        // Optionally, confirm to the client they have joined the room
        socket.emit("joined_chatroom", { success: true, chatroomID });
      } else {
        // Password is incorrect or chatroom does not exist
        console.log(`Socket ${socket.id} failed to join chatroom ${chatroomID}`);
        socket.emit("joined_chatroom", { success: false, error: "Invalid chatroom ID or password" });
      }
    } catch (error) {
      console.error(`Error finding chatroom: ${error}`);
      socket.emit("joined_chatroom", { success: false, error: "Server error while joining chatroom" });
    }
  });

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

//This is not necessary AFAI Understand
//Example for how to call the following endpoint http://localhost:4000/message?message=Content&user=Test User&chatroom=65d691acb3615c49d737f639
//Endpoint can be used to send new message data to the db
app.post("/message", async (req, res) => {
  try {
    const message = await Message.create({
      MessageContent: req.query.message,
      User: req.query.user,
      ChatroomID: req.query.chatroom,
    });
    io.to(req.query.chatroom).emit("new_message", message); // Broadcast the new message to the client(s) connected to the chatroom
    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Example for how to call the following endpoint http://localhost:4000/chatroom?password=coool
//Endpoint can be used to create a new chatroom and send data to the db
app.post("/chatroom", async (req, res) => {
  try {
    const chatroom = await Chatroom.create({
      Password:
        req.query.password + Math.round(Math.random() * 1000).toString(),
    });
    res.status(200).json(chatroom.Password);
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
