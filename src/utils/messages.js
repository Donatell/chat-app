const generateMessage = (username, text) => {
	return {
		username,
		text,
		createdAt: new Date().getTime(),
	};
};

const generateLocationMessage = (username, locationURL) => {
	return {
		username,
		url: locationURL,
		createdAt: new Date().getTime(),
	};
};

const generateSystemMessage = (text) => {
	return {
		text,
	};
};

module.exports = {
	generateMessage,
	generateLocationMessage,
	generateSystemMessage,
};
