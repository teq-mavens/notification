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
  	var mandrill 	= require('mandrill-api/mandrill');
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//

	console.log('basic mandrill CHILD got message:', m);
	try{
		mandrill_client = new mandrill.Mandrill(m.mandrill_api_key); //LQbgMHKl9P8alFeTilDmqQ
		var message = {
			"html": m.required_body.html_content, //<p>Example HTML content</p>
			"text": m.required_body.text_content, //Example text content
		    "subject": m.required_body.subject,
		    "from_email": m.required_body.from_email, //tjd@bimquote.com
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
		mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
		    if(result[0].status == 'sent'){
		    	var result_json = JSON.stringify(result);	    	
				let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let params = [m.push_type,m.reference_key,result[0].status,result_json];
				connection.query(sql,params, (err, rows, fields) => {
			        if (err){
			        	throw err;
			        } else{
			        	console.log('sent');
			        }					        
			    }); 
		    	
		    }else{	  
				var result_json = JSON.stringify(result);
				let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let params = [m.push_type,m.reference_key,result[0].status,result_json];
				connection.query(sql,params, (err, rows, fields) => {
			        if (err){
			        	throw err;
			        } else{
				        console.log('error in sent');
			        }					        
			    }); 
		    }
		}, function(e) {
		    // Mandrill returns the error as an object with name and message keys
		    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
		    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
			let sql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
			let params = [m.push_type,m.reference_key,e.status,JSON.stringify(e)];
			connection.query(sql,params, (err, rows, fields) => {
		        if (err){
		        	throw err;
		        } else{
			        console.log('mandrill error');
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