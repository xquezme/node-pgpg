var fs = require('fs'),
	util = require('util'),
	child_process = require('child_process'),
	spawn = child_process.spawn;


var encryptFile = function(options,fn){
	var name = options,name,
		fileName = options.fileName;
	spawn("gpg",["-e","-r",name,fileName]);
}
var generateKeyTemplate = function(options){
	return "Key-Type: "+options.keyType+"\n"+
	"Key-Length: "+options.keySize+"\n"+
	"Subkey-Type: "+options.subKeyType+"\n"+
	"Subkey-Length: "+options.subkeySize+"\n"+
	"Name-Real: "+options.name+"\n"+
	"Name-Comment: '"+options.comment+"'\n"+
	"Name-Email: "+options.email+"\n"+
	"Expire-Date: "+options.exire+"\n"+
	"Passphrase: "+options.passPhrase+"\n"+
	"%pubring temp2.pub\n"+
	"%secring temp2.sec\n"+
	"%commit\n"
}
var encryptString = function(options,fn){
	var name = options.name,
		message = options.message,
		fileName = options.fileName || "/"+name+"/temp.txt";

	var temp = function(){
		fs.writeFile(fileName,message,function(err){
			if(err){
				return fn.call(null,err);
			}
			encryptFile({
				name: name,
				fileName: fileName
			},fn)
		});
	};

	fs.exists("/"+name,function(exists){
		if(exists){
			temp.call(null)
		}else{
			fs.mkdir("/"+name,0777,function(err){
				if(err){
					return fn.call(null,err);
				}
				temp.call(null)
			})
		}
	});
}

module.exports = {
	/*
	*/
	generateKey: function(options,fn){
		options = options || {};
		var defaultConfig = {
			keyType: "RSA",
			subKeyType: "RSA",
			keySize: 2048,
			subkeySize: 2048,
			exire: 0,
			name: "Anon Anon",
			email: "tesst@test.rc",
			comment: '',
			passPhrase: "qwerty123414"
		};
		if(options.email){
			fs.writeFile(__dirname+"/"+"message.txt",generateKeyTemplate(defaultConfig), function(err){
				if(err){
					return fn.call(null,err);
				}
				var keyGenerationProcess = spawn("gpg",["--batch","--gen-key","message.txt"],{
					cwd: __dirname
				});
				keyGenerationProcess.on("exit",function(){
					fs.unlink(__dirname+"/"+"message.txt");
					return fn.call(null,null,true)
				});
			});
		}else{
			return fn.call(null, new Error("miss email"));
		}
	},
	encrypt: function(options,fn){

	},
	decrypt: function(options){

	}
}