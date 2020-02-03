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
		const subscription = req.body;
		var json_subscription = JSON.stringify(subscription);
		let selectSql = 'SELECT * FROM `subscription` WHERE `subscription_data`=?';
		let params = [json_subscription];

		connection.query(selectSql, params, (err, rows, fields) => {
			if (err) {
				throw err;
			}
			if (rows.length == 0) {
				// var unique_string = 'NE_'+ Date.now();
				let sql = 'INSERT INTO `subscription`(`subscription_data`) VALUES (?)';
				let insert_params = [json_subscription];
				connection.query(sql, insert_params, (err, rows, fields) => {
					if (err) {
						throw err;
					} else {
						res.status(200).json({});
						//create payload
						const payload = JSON.stringify({
							title: "Notification engine",
							options: {
								body: 'Thank you for subscribing...',
								icon: 'http://localhost/notification_engine/images/icon.png',
								badge: '../images/badge.png'
							}
						});

						//pass object into sendNotification
						webpush.sendNotification(subscription, payload)
							.then(function (response) {
								console.log('api response--------' + JSON.stringify(response));
							})
							.catch(err => console.error(err));
					}

				});
			} else {
				res.status(200).json({});
				//create payload
				const payload = JSON.stringify({
					title: "Notification engine",
					options: {
						body: 'You are already subscribed with us...',
						icon: 'http://localhost/notification_engine/images/icon.png',
						badge: 'images/badge.png'
					}
				});
				//pass object into sendNotification
				webpush.sendNotification(subscription, payload)
					.then(function (response) {
						console.log('api response--------' + JSON.stringify(response));
					})
					.catch(err => console.error(err));
			}
		});
	});
	return router;
};
