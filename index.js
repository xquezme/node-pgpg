var PGPG = require(__dirname + "/lib/pgpg");

// TESTING
var email = "test@example.com",
	pass = "test1test2",
	message = "hello world";

PGPG.generateKey({
	email: email,
	passPhrase: pass
}).then(function() {
	return PGPG.importKey({
		path: __dirname + "/lib/" + email + ".pub"
	});
}).then(function() {
	return PGPG.importKey({
		path: __dirname + "/lib/" + email + ".sec"
	});
}).then(function() {
	return PGPG.encrypt({
		email: email,
		message: message,
		out: __dirname + "/lib/testSec.txt"
	});
}).then(function(encryptedMessage) {
	return PGPG.decrypt({
		passPhrase: pass,
		email: email,
		message: encryptedMessage,
		out: __dirname + "/lib/testPub.txt"
	});
}).then(function(decryptedMessage) {
	console.log(decryptedMessage == message);
}).catch(function(err) {
	console.log(err);
});

module.exports = PGPG;