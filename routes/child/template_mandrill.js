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
	var mandrill = require('mandrill-api/mandrill');
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//

	console.log('template mandrill CHILD got message:', m);
	try {
		mandrill_client = new mandrill.Mandrill(m.mandrill_api_key);
		var message = {
			"html": m.required_body.html_content,
			"text": m.required_body.text_content,
			"subject": m.required_body.subject,
			"from_email": m.required_body.from_email,
			"from_name": m.required_body.from_name,
			"to": [{
				"email": m.required_body.to_email,
				"name": m.required_body.to_name,
				"type": "to"
			}],
		};
		var template_name = m.required_body.template_name_text;
		//Account Approved
		var template_content = m.required_body.template_content_text;
		var message = {
			"subject": m.required_body.subject,
			"from_email": m.required_body.from_email,
			"from_name": m.required_body.from_name,
			"to": [{
				"email": m.required_body.to_email,
				"name": m.required_body.to_name,
				"type": "to"
			}],
		};

		var async = false;
		var ip_pool = null;
		var send_at = null;
		mandrill_client.messages.sendTemplate({
			"template_name": template_name,
			"template_content": template_content,
			"message": message,
			"async": async,
			"ip_pool": ip_pool,
			"send_at": send_at
		}, function (result) {
			if (result[0].status == 'sent') {
				var result_json = JSON.stringify(result);
				let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let params = [m.push_type, m.reference_key, result[0].status, result_json];
				connection.query(sql, params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						console.log('mandrill template success log successfully inserted in database');
					}
				});

			} else {
				var result_json = JSON.stringify(result);
				let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let params = [m.push_type, m.reference_key, result[0].status, result_json];
				connection.query(sql, params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						console.log('mandrill template not sent log successfully inserted in database');
					}
				});
			}
		}, function (e) {
			// Mandrill returns the error as an object with name and message keys
			console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
			// A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
			let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
			let params = [m.push_type, m.reference_key, e.status, JSON.stringify(e)];
			connection.query(sql, params, (err, rows, fields) => {
				if (err) {
					throw err;
				} else {
					console.log('mandrill error');
				}
			});
		});
	} catch (ex) {
		let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
		let params = [m.push_type, m.reference_key, 'error', ''+ex+''];
		connection.query(sql, params, (err, rows, fields) => {
			if (err) {
				throw err;
			} else {
				console.log('mandrill error');
			}
		});
	}

});
