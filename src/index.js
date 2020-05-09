const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const  {generateMessage, generateLocationMessage}= require('./utils/messages');
const {getUser, getUsersInRoom, removeUser, addUser} = require('./utils/users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
var count = 0;
const publicDirectory = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
const Filter = require('bad-words');

app.use(express.static(publicDirectory));

io.on('connection', (socket) => {
    console.log('New web socket connection!');

    socket.on('sendMessage', (message, callback) => {
        const userData = getUser(socket.id);

        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }
        io.to(userData.room).emit('message', generateMessage(userData.username, message));
        callback();
    })

    socket.on('join', ({username, room}, callback) => {

        const { error,user } = addUser({id: socket.id, username, room});
        if(error) {
            return callback(error)
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('Admin',"Welcome!"));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined to the chat!`));
        io.emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message',generateMessage( 'Admin',`user ${user.username} has left the chat room.`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation', (location, callback) => {
        const userData = getUser(socket.id);
        io.to(userData.room).emit('locationMessage', 
        generateLocationMessage(userData.username, `https://google.com/maps?q=${location.longitude},${location.latitude}`)
        ); 
        callback();
    })
})


server.listen(port, ()=> {
    console.log(`app listen on port ${port}`);
})