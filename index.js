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

module.exports.encrypt({email:"dsad@mail.ru", "message": "22834324124",out: __dirname + "/lib/test.txt"},function(err,data){
	console.log(err,data);
	// module.exports.decrypt({email: "dsad@mail.ru",message:data},function(err,data2){
	// 	console.log(data2);
	// })
});