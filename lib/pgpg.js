var fs = require('fs');
var util = require('util');
var path = require("path");
var child_process = require('child_process');
var spawn = child_process.spawn;
var _ = require('lodash');
var Promise = require('es6-promise').Promise;

var generateKeyTemplate = function(options) {
	var str = "Key-Type: " + options.keyType + "\n" +
		"Key-Length: " + options.keySize + "\n" +
		"Subkey-Type: " + options.subKeyType + "\n" +
		"Subkey-Length: " + options.subkeySize + "\n" +
		"Name-Real: " + options.name + "\n";
	if (options.comment) {
		str += "Name-Comment: " + options.comment + "\n";
	}
	str += "Name-Email: " + options.email + "\n" +
		"Expire-Date: " + options.expire + "\n";
	if (options.passPhrase) {
		str += "Passphrase: " + options.passPhrase + "\n";
	}
	str += "%pubring " + options.fileName + ".pub\n" +
		"%secring " + options.fileName + ".sec\n" +
		"%commit\n";
	return str;
};

var exportKey = function(options, config) {
	return new Promise(function(resolve, reject) {
		options || (options = {});
		if (options.email) {
			var defaultsArgs = ["--armor", (config.secret ? "--export-secret-keys" : "--export"), options.email];
			var key = "";
			if (_.isString(options.path)) {
				var fileName = path.basename(options.path);
				var dir = path.dirname(options.path);
				defaultsArgs = ["--output", fileName].concat(defaultsArgs);
			}
			var exportKeyProcess = spawn("gpg", defaultsArgs, {
				cwd: dir
			});
			exportKeyProcess.stdout.on("data", function(data) {
				key += data.toString();
			});
			exportKeyProcess.on("exit", function(code) {
				if (code == 0) {
					resolve(options.path ? true : key);
				} else {
					reject(new Error("I/O error did occur."));
				}
			});
		} else {
			reject(new Error("Can't export key without email."));
		}
	});
};

var messageProcessing = function(options, config) {
	return new Promise(function(resolve, reject) {
		options || (options = {});

		if (!_.isString(options.email)) {
			reject(new Error("\"Email\" property required."));
			return;
		}

		var processName = (config.encrypt ? "--encrypt" : "--decrypt");
		var defaultsArgs = ["--no-use-agent", "--batch", "--always-trust", "--armor", "--recipient", options.email];
		var message = "";
		var fileName;
		var dir = __dirname;
		var outPath;
		var inPath;

		var messageProcessingCallback = function(err) {
			if (err) {
				reject(new Error("I/O error did occur."));
				return;
			}

			outPath = fileName + ".asc";

			if (!config.encrypt) {
				defaultsArgs = ["--passphrase-fd", "0"].concat(defaultsArgs);
			}

			defaultsArgs = defaultsArgs.concat(["--output", outPath, processName, fileName])
			outPath = dir + "/" + outPath;

			var encryptProcess;
			if (config.encrypt) {
				encryptProcess = spawn("gpg", defaultsArgs, {
					cwd: dir
				});

			} else {
				var str = "echo " + options.passPhrase + "|gpg " + defaultsArgs.join(" ");
				encryptProcess = child_process.exec(str, {
					cwd: dir
				});
			}

			encryptProcess.on("exit", function(code) {
				fs.readFile(outPath, function(err, data) {
					if (err) {
						reject(new Error("I/O error did occur."));
						return;
					}
					var dataString = data.toString();
					var messageProcessingReadFileCallback = function(err) {
						if (err) {
							reject(new Error("I/O error did occur."));
							return;
						}

						var messageProcessingWriteFileCallback = function(err) {
							if (err) {
								reject(new Error("I/O error did occur."));
								return;
							}

							fs.unlink(outPath, function(err) {
								if (err) {
									reject(new Error("I/O error did occur."));
									return;
								}

								resolve(dataString);
							});
						};

						if (_.isString(options.out)) {
							fs.writeFile(options.out, dataString, messageProcessingWriteFileCallback);
						} else {
							messageProcessingWriteFileCallback();
						}
					};

					if (options.message) {
						fs.unlink(inPath, messageProcessingReadFileCallback);
					} else {
						messageProcessingReadFileCallback();
					}
				});
			});
		}
		if (options.in || options.message) {
			if (options.message) {
				fileName = options.email + ".txt";
				inPath = dir + "/" + fileName;
				fs.writeFile(inPath, options.message, messageProcessingCallback);
			} else {
				dir = path.dirname(options.in);
				fileName = path.basename(options.in);
				messageProcessingCallback();
			}
		} else {
			reject(new Error("\"Message\" or \"in\" property required."));
		}
	});
};

module.exports = {
	exportPublicKey: function(options) {
		return exportKey(options, {
			secret: false
		});
	},
	exportSecretKey: function(options) {
		return exportKey(options, {
			secret: true
		});
	},
	importKey: function(options) {
		return new Promise(function(resolve, reject) {
			options || (options = {});

			if (!_.isString(options.path)) {
				reject(new Error("\"Path\" property required."));
				return;
			}

			var fileName = path.basename(options.path);
			var dir = path.dirname(options.path);
			spawn("gpg", ["--armor", "--import", fileName], {
				cwd: dir
			}).on("exit", function(code) {
				if (code != 0) {
					reject(new Error("I/O error did occur."));
					return;
				}
				resolve();
			});
		});
	},
	generateKey: function(options) {
		return new Promise(function(resolve, reject) {
			options || (options = {});
			var defaults = {
				keyType: "RSA",
				subKeyType: "RSA",
				keySize: 2048,
				subkeySize: 2048,
				expire: 0,
				name: "Anonymous Anonymous"
			};

			if (!_.isString(options.email)) {
				reject(new Error("\"Email\" property required."));
				return;
			}

			_.defaults(options, {
				fileName: __dirname + "/" + options.email
			}, defaults);

			var keyInfoPath = options.fileName;
			var keyInfoData = generateKeyTemplate(options);

			fs.writeFile(keyInfoPath, keyInfoData, function(err) {
				if (err) {
					reject(err);
					return;
				}
				spawn("gpg", ["--batch", "--gen-key", keyInfoPath], {
					cwd: __dirname
				}).on("exit", function(code) {
					if (code != 0) {
						reject(new Error("I/O error did occur."));
						return;
					}

					fs.unlink(keyInfoPath, function(err) {
						if (err) {
							reject(new Error("I/O error did occur."));
							return;
						}
						resolve();
					});
				});
			});
		});
	},
	encrypt: function(options) {
		return messageProcessing(options, {
			encrypt: true
		});
	},
	decrypt: function(options) {
		return messageProcessing(options, {
			encrypt: false
		});
	}
}