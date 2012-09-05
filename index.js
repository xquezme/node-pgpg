module.exports = require(__dirname + "/lib/pgpg");

module.exports.generateKey({email:"dsad@mail.ru"},function(err,data){
	console.log(err,data)
})