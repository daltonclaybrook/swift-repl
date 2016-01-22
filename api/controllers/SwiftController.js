/**
 * SwiftController
 *
 * @description :: Server-side logic for managing Swifts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const spawn = require('child_process').spawn;
var swiftProcess = null;

var self = module.exports = {

	repl: function(req, res) {

		var fullMessage = req.body.item.message.message;
	  var user = req.body.item.message.from.mention_name;

		if (fullMessage.length < 7) {
			return self.sendMessage('request must be a code block', res);
		}

		var command = fullMessage.slice(0, 6);
		var expression = fullMessage.slice(6, fullMessage.length) + '\n';

	  if (command != '/code\n') {
	    sails.log.verbose('invalid command');
	    return self.sendMessage('request must be a code block', res);
	  }

		if (!swiftProcess) {
			console.log('creating swift process!');
			swiftProcess = spawn('swift');
		} else {
			swiftProcess.stdout.removeAllListeners();
			swiftProcess.stderr.removeAllListeners();
			swiftProcess.removeAllListeners();
		}

		var dataToSend = '';
		var currentTimeout = null;
		var sentRes = false;

		swiftProcess.stdout.on('data', (data) => {
  		console.log('stdout: ' + data);
			dataToSend += data;

			if (currentTimeout) {
				clearTimeout(currentTimeout);
			}

			currentTimeout = setTimeout(() => {
				if (!sentRes) {
					sentRes = true;
					return self.sendMessage(dataToSend, res);
				}
			}, 500)
		});

		swiftProcess.stderr.on('data', (data) => {
  		console.log('stderr: ' + data);
			dataToSend += data;

			if (currentTimeout) {
				clearTimeout(currentTimeout);
			}

			currentTimeout = setTimeout(() => {
				if (!sentRes) {
					sentRes = true;
					return self.sendMessage(dataToSend, res);
				}
			}, 500)
		});

		swiftProcess.on('close', (code) => {
  		console.log('child process exited with code ' + code);
		});

		swiftProcess.on('error', (error) => {
  		console.log('error: ' + error);
		});

		swiftProcess.stdin.write(expression);
		currentTimeout = setTimeout(() => {
			if (!sentRes) {
				sentRes = true;
				return res.ok();
			}
		}, 5000)

	},

	start: function(req, res) {

		if (swiftProcess) {
			swiftProcess.kill();
		}

		console.log('creating swift process!');
		swiftProcess = spawn('swift');
		res.ok();

	},

	/*
		Private
	*/

	sendMessage: function(msg, res) {
		res.ok({
	    message: msg,
	    notify: false,
	    message_format: 'text'
	  });
	}

};
