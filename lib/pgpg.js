var fs = require('fs'),
	util = require('util'),
	path = require("path"),
	child_process = require('child_process'),
	spawn = child_process.spawn;

if(!("extend" in Object.prototype)){
	Object.defineProperty(Object.prototype, "extend", {
	    enumerable: false,
	    value: function(from) {
	        var props = Object.getOwnPropertyNames(from),
	        	self = this;
	        props.forEach(function(name) {
	                Object.defineProperty(self, name, Object.getOwnPropertyDescriptor(from, name));
	        });
	        return this;
	    }
	});
};

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
	"%pubring "+options.fileName+".pub\n"+
	"%secring "+options.fileName+".sec\n"+
	"%commit\n"
};
var exportKey = function(options,fn,config){
	options = options || {};
	if(options.email){
		var defaultsArgs = ["--armor",(config.secret ? "--export-secret-keys": "--export"),options.email],
			key = "";
		if(options.path){
			var fileName = path.basename(options.path),
				dir = path.dirname(options.path);
			defaultsArgs = ["--output",fileName].concat(defaultsArgs);
		}
		var exportKeyProcess = spawn("gpg",defaultsArgs,{
			cwd: dir
		});
		exportKeyProcess.stdout.on("data",function(data){
			key += data.toString();
		});
		exportKeyProcess.on("exit",function(code){
			if(code == 0){
				if(options.path){
					fn.call(null,null,true)
				}else{
					fn.call(null,null,key);
				}
			}else{

			}
		});
	}else{
		fn.call(null,new Error("miss email"));
	}
};
var messageProcessing = function(options,fn,config){
	options = options || {};
	var processName = (config.type == "encrypt" ? "--encrypt" : "--decrypt");
	if(options.email){
		var defaultsArgs = ["--always-trust","--armor","--recipient",options.email],
			message = "",
			fileName,
			dir = __dirname;
		
		var messageProcessingCallback = function(err){
			if(err){
				return fn.call(null,new Error("cannot write message to file"));
			}else{
				var outPath = fileName + ".asc";
				defaultsArgs = defaultsArgs.concat(["--output",outPath,processName,fileName])

				var encryptProcess = spawn("gpg",defaultsArgs,{
					cwd: dir
				});

				encryptProcess.on("exit",function(){
					fs.readFile(dir+"/"+outPath,function(err,data){

						if(options.message){
							fs.unlink(dir+"/"+fileName);
						}

						if(err){
							return fn.call(null, new Error("cannot read file"));
						}else{
							var messageProcessingWriteFileCallback = function(){
								fs.unlink(dir+"/"+outPath,function(err){
									return fn.call(null,null,data.toString());
								});
							}
							if(options.out){
								fs.writeFile(options.out,data.toString(),function(err){
									if(err){
										return fn.call(null, new Error("cannot write to"+options.out));
									}
									return messageProcessingWriteFileCallback.call(null);
								});
							}else{
								return messageProcessingWriteFileCallback.call(null);
							}
						}
					});

				});
			}
		}

		if(options.in || options.message){

			if(options.in){
				dir = path.dirname(options.in);
				fileName = path.basename(options.in);
				messageProcessingCallback.call(null,null);
			}else{
				fileName = options.email.split("@")[0]+".txt";
				// write message to temp file, unlink after process
				fs.writeFile(dir+"/"+fileName,options.message,messageProcessingCallback);
			}

		}else{
			return fn.call(null,new Error("empty message"));
		}

	}else{
		return fn.call(null,new Error("miss email"));
	}
}

module.exports = {
	/*
	*/
	exportPublicKey: function(options,fn){
		return exportKey(options,fn,{secret:false});
	},
	exportSecretKey: function(options,fn){
		return exportKey(options,fn,{secret: true});
	},
	importKey: function(options,fn){
		options = options || {};
		if(options.path){
			var fileName = path.basename(options.path),
				dir = path.dirname(options.path);
			spawn("gpg",["--armor","--import",fileName],{
				cwd: dir
			}).on("exit",function(code){
				if(code == 0){
					fn.call(null,null,true);
				}else{
					fn.call(null,new Error("key importing fails"))
				}
			});
		}else{
			fn.call(null,new Error("miss path"));
		}
	},
	generateKey: function(options,fn){
		options = options || {};
		var defaults = {
			keyType: "RSA",
			subKeyType: "RSA",
			keySize: 2048,
			subkeySize: 2048,
			exire: 0,
			name: 'Anonymous Anonymous',
			comment: '',
			passPhrase: '',
			fileName: "temp"
		};
		if(options.email){
			var name = options.email.split("@")[0];
				path = __dirname+"/"+name+".txt";
			defaults.fileName = name; 
			defaults.extend(options);

			fs.writeFile(path,generateKeyTemplate(defaults), function(err){
				if(err){
					return fn.call(null,err);
				}
				spawn("gpg",["--batch","--gen-key",name+".txt"],{
					cwd: __dirname
				}).on("exit",function(){
					fs.unlink(path);
					return fn.call(null,null,true)
				});
			});

		}else{
			return fn.call(null, new Error("miss email"));
		}
	},
	encrypt: function(options,fn){
		return messageProcessing(options,fn,{type:"encrypt"});
	},
	decrypt: function(options,fn){
		return messageProcessing(options,fn,{type: "decrypt"});
	}
}