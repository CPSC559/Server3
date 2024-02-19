const express = require('express');
const mongoose = require('mongoose');
const Chatroom = require('./models/Chatroom')
const Message = require('./models/Message')
const User = require('./models/User')
const http = require('http');
const socketIo = require('socket.io');

const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

const app = express();

//Remove cors
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow only the React client to connect
        methods: ["GET", "POST"] // Allow only these methods in CORS requests
      }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected, reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`Connection error: ${error}`);
  });
});
const uri = "mongodb+srv://AppUser:qvRGUENrpuplSpeT@cpsc559project.uhkbb5v.mongodb.net/CPSC559Project?retryWrites=true&w=majority";


mongoose.connect(uri)
.then((result)=>console.log('connected to db'))
const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Listening on port ${port}`));

app.get('/users', async(req,res)=>{
  User.find({})
  .then((result)=>{
    res.send(result);
  })
  .catch((err)=>{
    console.log(err);
  });
})
app.get('/chatrooms', async(req,res)=>{
  Chatroom.find({})
  .then((result)=>{
    res.send(result);
  })
  .catch((err)=>{
    console.log(err);
  });
})
app.get('/messages', async(req,res)=>{
  Message.find({})
  .then((result)=>{
    res.send(result);
  })
  .catch((err)=>{
    console.log(err);
  });
})