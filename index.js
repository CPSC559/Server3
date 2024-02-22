const express = require('express');
const mongoose = require('mongoose');
const Chatroom = require('./models/Chatroom')
const Message = require('./models/Message')
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require( 'bcrypt' );
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
//Example for how to call the following endpoint http://localhost:4000/message?message=Content&user=Test User&chatroom=65d691acb3615c49d737f639
//Endpoint can be used to send new message data to the db
app.post("/message", async (req,res) =>{
  try {
    const message = await Message.create({ MessageContent: req.query.message, User: req.query.user, ChatroomID: req.query.chatroom});
    res.status(200).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }

})
//Example for how to call the following endpoint http://localhost:4000/chatroom?password=coool 
//Endpoint can be used to create a new chatroom and send data to the db
app.post("/chatroom", async (req,res) =>{
  try {
    const chatroom = await Chatroom.create({ Password: req.query.password + Math.round((Math.random()*1000)).toString()});
    res.status(200).json(chatroom.Password);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
  })
  //Example of how to call the following endpoint http://localhost:4000/room?password=coool390
  //This endpoint can be called to login a user it will take a password as a parameter and either send back the chatroom id 
  //or send back a message stating invalid chatroom password
  app.get('/room', async(req,res)=>{
    Chatroom.find({Password: req.query.password})
    .then((result)=>{
      if(result.length==0){
        res.send("Invalid Chatroom Password");
      }
      else{
        res.send(result[0]["_id"]);
      }
    })
    .catch((err)=>{
      console.log(err);
    });
  })