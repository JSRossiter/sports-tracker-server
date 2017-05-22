require('dotenv').config();

const express = require('express');
const path = require('path');
const uuidV4 = require('uuid/v4');

const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || 'development';

const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig[ENV]);
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const dbUsers = require('./db/users')(knex);
const dbFavourites = require('./db/favourites')(knex);
const dbCards = require('./db/cards')(knex);

app.use(express.static('build'));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '/index.html'));
});

server.listen(PORT, () => {
  console.log(`Sports tracker listening on port ${PORT}`);
});

const broadcastUserCount = (room) => {
  const onlineUsersMsg = {
    room,
    userCount: io.sockets.adapter.rooms[room].length
  };
  io.in(room).emit('user count', onlineUsersMsg);
};

const broadcast = (params) => {

};

io.on('connection', (socket) => {
  console.log('new client');
  socket.on('post', (data) => {
    console.log('post to', data.room, ':', data.message);
    const newMessage = data.message;
    newMessage.id = uuidV4();
    newMessage.room = data.room;
    io.in(data.room).emit('post', newMessage);
  });
  socket.on('join', (data) => {
    console.log(data.user, 'is joining', data.room);
    socket.join(data.room);
    broadcastUserCount(data.room);
  });
  socket.on('leave', (data) => {
    socket.leave(data.room);
    broadcastUserCount(data.room);
  });

  let usersRooms = [];
  socket.on('disconnecting', () => {
    usersRooms = Object.values(socket.rooms).filter(e => typeof e === 'number');
  });
  socket.on('disconnect', () => {
    usersRooms.forEach((room) => {
      broadcastUserCount(room);
    });
  });
});
