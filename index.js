module.exports = require(__dirname + "/lib/pgpg");
// TESTING
var email = "test@example.com",
	pass = "test1test2",
	message = "hello world";

module.exports.generateKey({email:email,passPhrase:pass},function(err,data){
	module.exports.importKey({path: __dirname + "/lib/"+email.split("@")[0]+".pub"},function(err,data){
		module.exports.importKey({path: __dirname + "/lib/"+email.split("@")[0]+".sec"},function(err,data){
			module.exports.encrypt({email:email, "message": message, out:__dirname+"/lib/testSec.txt"},function(err,data){
				module.exports.decrypt({passPhrase: pass,email: email,"message":data,out:__dirname+"/lib/testPub.txt"},function(err,data2){
					console.log(data2 == message);
				});
			});
		});
	});
});
