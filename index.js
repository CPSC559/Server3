const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
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

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Listening on port ${port}`));