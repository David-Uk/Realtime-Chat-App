// Import dependencies
const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const router = require('./routes/router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.onconnection('connection', socket => {
	socket.on('join', ({ name, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, name, room });

		if (error)
			return callback(error);

		socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room` });
		socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined` });

		socket.join(user.room);

		io.to(user.room).emit('roomData', { room: userroom, users: getUsersInRoom(user.room) });

		callback();
	});

	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);

		io.to(user.room).emit('message', { user: user.name, text: message });
		io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

		callback();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if (user)
			io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left` });
	})

})

app.use(router);

server.listen(PORT, () => {
	console.log(`Server active on port ${PORT}`);
})