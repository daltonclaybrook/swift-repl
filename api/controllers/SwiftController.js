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

		var expression = req.body.expression;
		if (!expression) {
			return res.badRequest();
		}
		expression += '\n';

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
					return res.ok({
						out: dataToSend
					});
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
					return res.ok({
						err: dataToSend
					});
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

	}

};
