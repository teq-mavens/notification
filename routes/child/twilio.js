process.on('message', function (m) {
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	var mysql = require('mysql');
	var credentials;
	try {
		credentials = require('../../config/db_credentials'); //CREATE THIS FILE YOURSELF
	} catch (e) {
		credentials = require('../../config/db_credentials_env');
	}
	var connection = mysql.createConnection(credentials);
	connection.connect();
	var twilio_credentials = require('../../config/twilio_credentials');
	var accountSid = twilio_credentials.accountSid;
	var authToken = twilio_credentials.authToken;
	var twilio = require('twilio');
	var client = new twilio(accountSid, authToken);
	var MessagingResponse = require('twilio').twiml.MessagingResponse;
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//

	console.log('sms twilio CHILD got message:', m);
	try {
		client.messages.create({
			to: '+' + m.required_body.to_country_code + m.required_body.to_number,
			from: '+' + m.required_body.from_country_code + m.required_body.from_number,
			body: m.required_body.message
		}, function (error, message) {
			if (!error) {
				var message_json = JSON.stringify(message);
				var status = (message.status) ? message.status : '';

				let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let params = [m.push_type, m.reference_key, status, message_json];
				connection.query(sql, params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						console.log('sms twilio success log successfully inserted in database');
					}
				});
			} else {
				let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let params = [m.push_type, m.reference_key, 'error', error];
				connection.query(sql, params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						console.log('sms twilio error log successfully inserted in database');
					}
				});
			}
		});
	} catch (ex) {
		let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
		let params = [m.push_type, m.reference_key, 'error', ex];
		connection.query(sql, params, (err, rows, fields) => {
			if (err) {
				throw err;
			} else {
				console.log('sms twilio error log successfully inserted in database');
			}
		});
	}

});
