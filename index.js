module.exports = require(__dirname + "/lib/pgpg");

// module.exports.generateKey({email:"dsad@mail.ru",passPhrase:"22289999"},function(err,data){
// 	console.log(err,data)
// })

// module.exports.importKey({path: __dirname + "/lib/dsad.pub"},function(err,data){
// 	console.log(err,data)
// });

// module.exports.exportSecretKey({email:"dsad@mail.ru"},function(err,data){
// 	console.log(err,data)
// });

module.exports.encrypt({email:"dsad@mail.ru",in:__dirname + "/lib/test.key",out:"temp.txt"},function(err,data){
	console.log(err,data)
});