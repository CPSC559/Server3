const express = require('express');
const mongoose = require('mongoose');
const Chatroom = require('./models/Chatroom')
const Message = require('./models/Message')
const User = require('./models/User')
const http = require('http');
const socketIo = require('socket.io');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
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