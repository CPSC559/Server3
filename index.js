const express = require("express");
const mongoose = require("mongoose");
const Chatroom = require("./models/Chatroom");
const Message = require("./models/Message");
const http = require("http");
const socketIo = require("socket.io");
const chatroomCleanup = require("./chatroomCleanup");
const serializationUtils = require("./serializationUtils");
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const axios = require("axios");

//Variable to store socket ID mappings
const publicKeyToSocketIdMap = {};

// chatroom message index counter
const chatroomIndices = {};

const app = express();

//list of other servers to send updates to
const otherServers = ["http://localhost:4000", "http://localhost:4001"];
//Process id assigned static by default
const id = 4002;
//Leader is set to zero but upon server 3 starting it will become the leader
var leader=0;


app.use(cors());
app.use(express.json());

const server = http.createServer(app);
//Assign server 3 leader id will default to leader in any circumstances where it starts
leader=id;
//Send leader message to other servers
otherServers.forEach((server) => {
  const response = axios.post(`${server}/leader`, {
      leader: leader
  }).catch((error) => {
    console.error(`Failed to send message to server: ${server}`, error);
    leader = id;
  });
});
//Setup server socket connection and allow only certain origins
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3006"], // Allow only the React client to connect
    methods: ["GET", "POST"], // Allow only these methods in CORS requests
  },
});

//On socket connection
io.on("connection", (socket) => {
  console.log("Client connected");
  //Make sure leader is set to server 3
  leader=id;
  //Broadcast leader message to other servers
  otherServers.forEach((server) => {
    const response = axios.post(`${server}/leader`, {
        leader: leader
    }).catch((error) => {
      console.error(`Failed to send message to server: ${server}`, error);
      leader = id;
    });
  })
  //Heartbeat message achieved with ping messages client will change servers if this ping times out indicating server failure
  socket.on("ping", () => {
    console.log("Received ping from client. Sending pong...");
    socket.emit("pong");
  });
  //When disconnect console log message
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected, reason: ${reason}`);
  });
  //Register public key is a unique message that has the following behavior defined for when the socket receives the message
  socket.on("register_public_key", (info) => {
    console.log(info.publicKey);
    //Add the socket id to the public key mapping list
    publicKeyToSocketIdMap[info.publicKey] = socket.id;
    //Find the chatroom that the user has logged into then 
    Chatroom.findOne({ Password: info.chatroom }).then((result) => {
      if (result) {
        //Broadcast the socket ID mapping to all other connected clients in the chatroom to ensure they will encrypt messages for new user in mind as well
        result.UserPubKeys.forEach((key) => {
          console.log(key);
          const recipientSocketId = publicKeyToSocketIdMap[key];
          if (recipientSocketId) {
            // Use Socket.IO to send the message to the recipient's socket
            io.to(recipientSocketId).emit("new_public_keys", {
              publicKeys: result.UserPubKeys,
            });
          } else {
            console.log(publicKeyToSocketIdMap);
            console.log(`Recipient with public key ${key} not connected.`);
          }
        });
      } else {
        console.log("No result");
      }
    });
  });

  socket.on("error", (error) => {
    console.error(`Connection error: ${error}`);
  });
});
//Mongoose URI to ensure connection to server 3 database
const uri =
"mongodb+srv://AppUser:3oilIo0ZWs6YIH6F@server3.wwj5xnt.mongodb.net/?retryWrites=true&w=majority&appName=Server3";
//Connect the server to the mongodb instance then set the server to listen on port 4002
mongoose.connect(uri).then((result) => console.log("connected to db"));
const port = process.env.PORT || 4002;
server.listen(port, () => console.log(`Listening on port ${port}`));

chatroomCleanup();

const generateColor = (publicKey) => {
  // Calculate a hash code to create a color from the public key
  const hashCode = publicKey.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const hue = hashCode % 360;

  return `hsl(${hue}, 70%, 86%)`;
};

function generateIndexFromHash(hash, dictionarySize) {
  // Taking a slice of the hash to get a smaller number and converting it to an integer
  if(hash < 0) {
    hash = hash * -1;
  }
  // Using modulo to ensure the index fits within the dictionary size
  return hash % dictionarySize;
}

const generateUserName = (publicKey) => {
  const hashCode = publicKey.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  const adjectiveIndex = generateIndexFromHash(hashCode, adjectives.length);
  const animalIndex = generateIndexFromHash(hashCode, animals.length);

  const adjective = adjectives[adjectiveIndex];
  const animal = animals[animalIndex];

  // Combine and format the words to form the username
  return `${adjective.charAt(0).toUpperCase() + adjective.slice(1)}${animal.charAt(0).toUpperCase() + animal.slice(1)}`;
}
//Election endpoint implementation kept relatively consistent across endpoints but server 3 should never encounter an id higher then it.
app.post("/election",  async (req, res) => {
  //Take sending message id then see if it is higher then the process id
   mid = req.body.id 
   if (mid<id)
   {
    //Since all other servers are lower then server 3 it will try to broadcast leader message to all servers
    otherServers.forEach((server) => {
      const response = axios.post(`${server}/leader`, {
          leader: leader
      }).catch((error) => {
        console.error(`Failed to send message to server: ${server}`, error);
        leader = id;
      });
    });
    res.send("Ok")
   }
   else{
    //If the other server has a higher id must disconnect from the socket to allow for new leader connection
    io.disconnectSockets();
   }
});
//Set new leader id and disconnect socket if there were any connections to move them to the new leader
app.post("/leader",  async (req, res) => {
  lead = req.body.leader 
  leader= lead;
  io.disconnectSockets();
});

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
    const serializedEncryptedMessage = req.body.cipher;
    const serializedRecipients = req.body.recipients;
    const senderBase64PublicKey = req.body.senderBase64PublicKey
    const clientColor = generateColor(senderBase64PublicKey);
    const userName = generateUserName(senderBase64PublicKey);

    const message = await Message.create({
      Cipher: serializedEncryptedMessage,
      // sender should be inferred through socket
      Sender: senderBase64PublicKey,
      ChatroomID: req.body.currChatroom,
      MessageIndex: chatroomIndices[req.body.currChatroom]
    });

    //If the message came from the client, lets forward the message to each other server
    if (req.body?.fromClient) {
      otherServers.forEach((server) => {
        axios
          .post(`${server}/message`, {
            cipher: serializedEncryptedMessage,
            recipients: serializedRecipients,
            senderBase64PublicKey: senderBase64PublicKey,
            currChatroom: req.body.currChatroom,
          })
          .then((response) => {
            console.log(`Sent message to server ${server} successfully.`);
          })
          .catch((error) => {
            console.error(`Failed to send message to server: ${server}`, error);
          });
      });
    }

    const recipients =
      serializationUtils.deserializeUint8ArrayObject(serializedRecipients);

    Object.entries(recipients).forEach(([publicKey, encryptedSymmetricKey]) => {
      const serializedEncryptedSymmetricKey =
        serializationUtils.serializeUint8ArrayObject(encryptedSymmetricKey);
      const recipientSocketId = publicKeyToSocketIdMap[publicKey];
      if (recipientSocketId) {
        // Use Socket.IO to send the message to the recipient's socket
        io.to(recipientSocketId).emit("new_message", {
          serializedEncryptedMessage,
          serializedEncryptedSymmetricKey,
          clientColor: clientColor,
          userName: userName,
          messageIndex: chatroomIndices[req.body.currChatroom]
        });
      } else {
        console.log(publicKeyToSocketIdMap);
        console.log(`Recipient with public key ${publicKey} not connected.`);
      }
    });
    console.log("Made message");

    chatroomIndices[req.body.currChatroom] += 1;

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
    const chatroom = await Chatroom.create({
      Password: req.body.password,
      UserPubKeys: [req.body.userPubKey],
    });

    //If the message came from the client, lets forward the message to each other server
    if (req.body?.fromClient) {
      otherServers.forEach((server) => {
        axios
          .post(`${server}/chatroom`, {
            password: req.body.password,
            userPubKey: req.body.userPubKey,
          })
          .then((response) => {
            console.log(`Sent chatroom to server ${server} successfully.`);
          })
          .catch((error) => {
            console.error(
              `Failed to send chatroom to server ${server}:`,
              error
            );
          });
      });
    }
    
    chatroomIndices[req.body.password] = 0;

    res.status(200).json(chatroom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Example of how to call the following endpoint http://localhost:4000/room?password=coool390
//This endpoint can be called to login a user it will take a password as a parameter and either send back the chatroom id
//or send back a message stating invalid chatroom password
app.get("/room", async (req, res) => {
  const publicKey = req.query.publicKey;
  const password = req.query.Password;


  //If the message came from the client, lets forward the message to each other server
  if (req.query?.fromClient) {
    otherServers.forEach((server) => {
      axios
        .get(`${server}/room`, {
          params: {
            publicKey: req.query.publicKey,
            Password: req.query.Password,
          }
        })
        .then((response) => {
          console.log(`Sent message to server ${server} successfully.`);
        })
        .catch((error) => {
          console.error(`Failed to send message to server: ${server}`, error);
        });
    });
  }
  Chatroom.findOne({ Password: password })
    .then((chatroom) => {
      if (!chatroom) {
        return res.status(400).json({ error: "Invalid Chatroom Password" });
      }

      // Ensure publicKey is provided
      if (!publicKey) {
        return res.status(400).json({ error: "Public key is required" });
      }

      // Add the publicKey to the UserPubKeys array
      Chatroom.updateOne(
        { _id: chatroom._id },
        { $addToSet: { UserPubKeys: publicKey } }
      )
        .then((updateResult) => {
          res.status(200).json({ password: chatroom.Password });
        })
        .catch((updateError) => {
          console.error(updateError);
          res.status(500).json({ error: "Failed to add user public key" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "An error occurred" });
    });
});