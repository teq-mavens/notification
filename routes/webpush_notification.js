//Dependencies - Express 4.x and the MySQL Connection
module.exports = (express, connection) => {
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	var router = express.Router();
	var webpush = require('web-push');
	var schedule = require('node-schedule');
	var webpush_credentials = require('../config/webpush_credentials');
	webpush.setVapidDetails('mailto:test@test.com', webpush_credentials.publicVapidKey, webpush_credentials.privateVapidKey);
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	// Router Middleware
	router.use((req, res, next) => {
		// log each request to the console
		console.log("You have hit the /api", req.method, req.url);
		// CORS 
		res.header("Access-Control-Allow-Origin", "*"); //TODO: potentially switch to white list version
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		// we can use this later to validate some stuff
		// continue doing what we were doing and go to the route
		next();
	});
	/*-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	 *-- Date - 6th jan 2020
	 *-- Function : Node post api - to subscribe users for push notification
	 *-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
	router.post('/', (req, res) => {
		
		console.log("req.body-----------"+req.body);

		const subscription = req.body.subscription === '' || req.body.subscription === undefined ? '' : req.body.subscription;
		const user_id = req.body.user_id === '' || req.body.user_id === undefined ? 0 : req.body.user_id;
		
		var json_subscription = JSON.stringify(subscription);
		let selectSql = 'SELECT * FROM `subscription` WHERE `subscription_data`=?';
		let params = [json_subscription];

		connection.query(selectSql, params, (err, rows, fields) => {
			if (err) {
				throw err;
			}
			if (rows.length == 0) {
				console.log('insert value');			
				let sql = 'INSERT INTO `subscription`(`user_id`,`subscription_data`) VALUES (?,?)';
				let insert_params = [user_id,json_subscription];
				connection.query(sql, insert_params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						res.status(200).json({});
						//create payload
						const payload = JSON.stringify({
							title: "Notification engine",
							options: {
								body: 'Thank you for subscribing.',
								icon: '../images/icon.png',
								badge: '../images/badge.png'
							}
						});

						if(!!subscription){
							//pass object into sendNotification
							webpush.sendNotification(subscription, payload)
								.then(function (response) {
									console.log('api response--------' + JSON.stringify(response));
								})
								.catch(err => console.error(err));
						}else{
							console.log("empty subscription string");
						}
						
					}

				});
			} else {
				// update subscription 
				console.log('update value');
				let sql = 'UPDATE `subscription` SET `subscription_data`=? WHERE `user_id`=?';
				let update_params = [json_subscription,user_id];
				connection.query(sql, update_params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						res.status(200).json({});
						//create payload
						const payload = JSON.stringify({
							title: "Notification engine",
							options: {
								body: 'Your subscription is updated.',
								icon: '../images/icon.png',
								badge: '../images/badge.png'
							}
						});
						if(!!subscription){
							//pass object into sendNotification
							webpush.sendNotification(subscription, payload)
								.then(function (response) {
									console.log('api response--------' + JSON.stringify(response));
								})
								.catch(err => console.error(err));
						}else{
							console.log("empty subscription string");
						}
						
					}

				});

			}
		});
	});
	return router;
};
