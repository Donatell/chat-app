const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const Filter = require("bad-words");
const filter = new Filter();
const { generateMessage, generateLocationMessage, generateSystemMessage } = require("./utils/messages.js");
const { getUser, getUsersInRoom, addUser, removeUser } = require("./utils/users.js");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

app.get("", async (req, res) => {
	res.send("index.html");
});

io.on("connection", (socket) => {
	socket.on("join", ({ username, room }, callback) => {
		const { error, user } = addUser({
			id: socket.id,
			username,
			room,
		});

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room),
		});

		socket.emit("welcomeMessage", generateSystemMessage("Welcome to chat!"));
		socket.broadcast
			.to(user.room)
			.emit("userJoined", generateSystemMessage(`${user.username} has joined the room`));

		callback();
	});

	// receive normal message from user and spread it to all users
	socket.on("sendMessage", (messageText, callback) => {
		try {
			const user = getUser(socket.id);
			io.to(user.room).emit("newMessage", generateMessage(user.username, messageText));
			callback("The message was received by the server! (acknowledgement)");
		} catch (error) {
			callback(error);
		}
	});

	// receive location message from user and spread it to all users
	socket.on("locationMessage", (locationURL, callback) => {
		const user = getUser(socket.id);

		io.to(user.room).emit("locationURL", generateLocationMessage(user.username, locationURL));
		callback("The location was received by the server! (acknowledgement)");
	});

	socket.on("disconnect", (callback) => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit("userDisconnected", generateSystemMessage(`${user.username} has left`));
			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

server.listen(process.env.PORT, () => {
	console.log("Server is up on " + process.env.PORT);
});
