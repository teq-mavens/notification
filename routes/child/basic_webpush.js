process.on('message', function(m) {
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	var mysql       = require('mysql');
  	var credentials;
	try{
	    credentials = require('../../config/db_credentials'); //CREATE THIS FILE YOURSELF
	}catch(e){
	    credentials = require('../../config/db_credentials_env');
	}
	var connection  = mysql.createConnection(credentials);
	connection.connect();
	var webpush     = require('web-push');
	var webpush_credentials = require('../../config/webpush_credentials');
	webpush.setVapidDetails('mailto:test@test.com',webpush_credentials.publicVapidKey,webpush_credentials.privateVapidKey);
  	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	console.log('basic web push CHILD got message:', m);
	try{
		var subscription = JSON.parse(m.subscription_details);
		//create payload
		const payload = JSON.stringify({
			title:m.required_body.html_title,
			options : { body: m.required_body.html_body }
		});

		//pass object into sendNotification
		webpush.sendNotification(subscription,payload)
		.then(function(response){
	        var response_json = JSON.stringify(response);
			
			let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
			let params = [m.push_type,m.reference_key,response.statusCode,response_json];
			connection.query(sql,params, (err, rows, fields) => {
		        if (err){
		        	throw err;
		        } else{
		        	console.log('webpush success log successfully inserted in database');
		        }					        
		    });
		})
		.catch(function(error) {

			var error_json = JSON.stringify(error);			
			let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
			let params = [m.push_type,m.reference_key,'error',error_json];
			connection.query(sql,params, (err, rows, fields) => {
		        if (err){
		        	throw err;
		        } else{
		        	console.log('webpush error log successfully inserted in database');
		        }					        
		    });
		});
	}catch(ex){
		let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
		let params = [m.push_type,m.reference_key,'error',''+ex+''];
		connection.query(sql,params, (err, rows, fields) => {
	        if (err){
	        	throw err;
	        } else{
	        	console.log('webpush error log successfully inserted in database');
	        }					        
	    });
	}
});
