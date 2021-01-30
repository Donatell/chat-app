const socket = io();

// elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $geolocationButton = document.querySelector("#share-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const systemMessageTemplate = document.querySelector("#system-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

const autoscroll = () => {
	// new message element
	const $newMessage = $messages.lastElementChild;

	// Height of the new message
	const newMessageStyle = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyle.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// visible height
	const visibleHeight = $messages.offsetHeight;

	// Height of messages container
	const containerHeight = $messages.scrollHeight;

	// how far has user scrolled
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
};

// *** SEND TO SERVER ***
// send a message
$messageForm.addEventListener("submit", (e) => {
	e.preventDefault();
	$messageFormButton.setAttribute("disabled", "disabled");
	const messageText = e.target.elements.message.value;

	socket.emit("sendMessage", messageText, (response) => {
		$messageFormButton.removeAttribute("disabled");
		$messageFormInput.value = "";
		$messageFormInput.focus();

		console.log(response);
	});
});

// share location by pressing button
document.querySelector("#share-location").addEventListener("click", () => {
	if (!navigator.geolocation) {
		return alert("Geolocation is not supported by your browser");
	}
	$geolocationButton.setAttribute("disabled", "disabled");

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			"locationMessage",
			`https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
			(response) => {
				$geolocationButton.removeAttribute("disabled");
				console.log(response);
			}
		);
	});
});

// *** RECEIVE FROM SERVER ***
// message from server on connection
socket.on("welcomeMessage", (message) => {
	console.log(message);
	const messageHtml = Mustache.render(systemMessageTemplate, {
		message: message.text,
	});
	$messages.insertAdjacentHTML("beforeend", messageHtml);
	autoscroll();
});

// render sidebar
socket.on("roomData", ({ room, users }) => {
	const messageHtml = Mustache.render(sidebarTemplate, {
		room,
		users,
	});
	$sidebar.innerHTML = messageHtml;
});

// user joined notification
socket.on("userJoined", (message) => {
	console.log(message);
	const messageHtml = Mustache.render(systemMessageTemplate, {
		message: message.text,
	});
	$messages.insertAdjacentHTML("beforeend", messageHtml);
	autoscroll();
});

// user left notification
socket.on("userDisconnected", (message) => {
	const messageHtml = Mustache.render(systemMessageTemplate, {
		message: message.text,
	});
	$messages.insertAdjacentHTML("beforeend", messageHtml);
	autoscroll();
});

// receive incoming messages
socket.on("newMessage", (message) => {
	console.log(message);
	const messageHtml = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format("HH:mm"),
	});
	$messages.insertAdjacentHTML("beforeend", messageHtml);
	autoscroll();
});

// render incoming location messages
socket.on("locationURL", (message) => {
	console.log(message);
	const locationMessageHtml = Mustache.render(locationMessageTemplate, {
		username: message.username,
		locationURL: message.url,
		createdAt: moment(message.createdAt).format("HH:mm"),
	});
	$messages.insertAdjacentHTML("beforeend", locationMessageHtml);
	autoscroll();
});

socket.emit("join", { username, room }, (error) => {
	if (error) {
		window.alert(error);
		location.href = "/";
	}
});
