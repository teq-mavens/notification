process.on('message', function(m) {
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	var mysql       = require('mysql');
  	var credentials;
	try{
	    credentials = require('../../config/db_credentials'); //CREATE THIS FILE YOURSELF
	}catch(e){
	    //heroku support
	    credentials = require('../../config/db_credentials_env');
	}
	var connection  = mysql.createConnection(credentials);
	connection.connect();
  	var sgMail  	= require('@sendgrid/mail');
  	
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//

	console.log('sendgrid CHILD got message:', m);
	try{

		sgMail.setApiKey(m.sendgrid_api_key);
		var msg = {
		  to: m.required_body.to_email, 
		  from: m.required_body.from_email, 
		  subject: m.required_body.subject,
		  text: m.required_body.text_content,
		  html: m.required_body.html_content,
		};

		sgMail.send(msg)
		.then(function(response){
			
	        var response_json = JSON.stringify(response);
			let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
			let params = [m.push_type,m.reference_key,response[0].statusCode,response_json];
			connection.query(sql,params, (err, rows, fields) => {
		        if (err){
		        	throw err;
		        } else{
		        	console.log('sendgrid success log successfully inserted in database');
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
		        	console.log('sendgrid error log successfully inserted in database');
		        }					        
		    });
		});	

	}catch(ex){
		let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
		let params = [m.push_type,m.reference_key,'error',ex];
		connection.query(sql,params, (err, rows, fields) => {
	        if (err){
	        	throw err;
	        } else{
		        console.log('mandrill error');
	        }					        
	    }); 
	}

});