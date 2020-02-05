//Dependencies - Express 4.x and the MySQL Connection
module.exports = (express, connection) => {
	//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	var router = express.Router();
	// >>>>>>>>>> constant configration file
	const CONST_PARAM = require('../config/constant');
	// >>>>>>>>>> default configration file
	const DEFAULT_PARAM = require('../config/default');
	// >>>>>>>>>> mandrill configration file
	var mandrill_credentials = require('../config/mandrill_credentials');
	// >>>>>>>>>> sendgrid configration file
	var sendgrid_credentials = require('../config/sendgrid_credentials');
	// >>>>>>>>>> sms configration file 
	var twilio_credentials = require('../config/twilio_credentials');	
	// >>>>>>>>>> web push schedule
	var schedule = require('node-schedule');
	// >>>>>>>>>> child process
	var child = require('child_process');
	//.>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.//
	// Router Middleware
	router.use((req, res, next) => {
		// log each request to the console
		console.log("You have hit the /api", req.method, req.url);
		// CORS 
		res.header("Access-Control-Allow-Origin", "*"); //TODO: potentially switch to white list version
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});
	/*-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	 *-- Date - 15th jan 2020
	 *-- Function : Node post api - Test url 
	 *-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
	router.get('/', (req, res) => {
		console.log('in route all in one notification file');
		res.jsonp({
			name: 'all notification API',
			version: '1.0',
		});

	});
	/*-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	 *-- Date - 15th jan 2020
	 *-- Function : Node post api - send push notifications on the bases of there type
	 *-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
	router.post('/send', (req, res) => {
		console.log('-----------in notification send api-----------');
		console.log('---- got the data req.body -------'+JSON.stringify(req.body)); 
		var pushdata = req.body === '' || req.body === undefined ? '' : req.body;	
		console.log('---- got the data -------'+pushdata); 
		var response_arr = []; /*-- final response array --*/
		var data = {
			'body': ""
		};
		try {
			if ((pushdata.length != 0) || !!pushdata) {
				// pushdata not empty
				var message_arr = [];
				var pushdata_length = pushdata.length; /*-- get push data length --*/
				for (var i = 0; i < pushdata_length; i++) {
					/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> INSERT PUSH DATA IN DATA BASE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
					let insertsql = 'INSERT INTO `push_data`(`push_category`, `push_type`, `push_subtype`, `push_body`) VALUES (?,?,?,?)';
					let insertparams = [pushdata[i].push_category, pushdata[i].push_type, pushdata[i].push_subtype, JSON.stringify(pushdata[i].push_body)];
					connection.query(insertsql, insertparams, (err, rows, fields) => {
						if (err) {
							throw err;
						} else {
							console.log('Push data successfully inserted in database');
						}
					});
					/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> END INSERT PUSH DATA IN DATA BASE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
					var category = (pushdata[i].push_category) ? pushdata[i].push_category : DEFAULT_PARAM.DEFAULT_CATEGORY;

					if (!!category) {
						/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ONE TIME CATEGORY >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
						if (category == CONST_PARAM.ONETIME) {
							// send notification one time
							var type = (pushdata[i].push_type) ? pushdata[i].push_type : DEFAULT_PARAM.DEFAULT_TYPE;
							/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> EMAIL TYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
							if (type == CONST_PARAM.EMAIL) {
								var subtype = (pushdata[i].push_subtype) ? pushdata[i].push_subtype : DEFAULT_PARAM.DEFAULT_EMAIL_SUBTYPE;
								/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> MANDRILL SUBTYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								if (subtype == CONST_PARAM.MANDRILL) {
									var body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var j = 0; j < body.length; j++) {
										var email_type = (body[j].email_type) ? body[j].email_type : '';
										/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> BASIC >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
										if (email_type == CONST_PARAM.BASIC) {
											var html_content = body[j].html_content === '' || body[j].html_content === undefined ? '' : body[j].html_content;
											var text_content = body[j].text_content === '' || body[j].text_content === undefined ? '' : body[j].text_content;
											var subject = body[j].subject === '' || body[j].subject === undefined ? '' : body[j].subject;
											var from_email = body[j].from_email === '' || body[j].from_email === undefined ? '' : body[j].from_email;
											var from_name = body[j].from_name === '' || body[j].from_name === undefined ? '' : body[j].from_name;
											var to_email = body[j].to_email === '' || body[j].to_email === undefined ? '' : body[j].to_email;
											var to_name = body[j].to_name === '' || body[j].to_name === undefined ? '' : body[j].to_name;

											// check for mandrill credentials
											if (!!mandrill_credentials.api_key) {
												if (!!from_email && !!to_email && !!subject) {
													var basic_unique_string = 'NE_' + Date.now() + makeid(6);
													// mandrill basic child email
													message_arr.push({
														error: CONST_PARAM.ERROR_0,
														success: CONST_PARAM.SUCCESS_200,
														error_key: "",
														reference_key: basic_unique_string
													});
													var childTask = child.fork('./routes/child/basic_mandrill.js');
													childTask.send({
														push_type: 'mandrill basic',
														required_body: body[j],
														mandrill_api_key: mandrill_credentials.api_key,
														reference_key: basic_unique_string
													});
													// end mandrill basic child email
												} else {
													message_arr.push({
														error: CONST_PARAM.ERROR_401,
														success: CONST_PARAM.SUCCESS_0,
														error_key: "Please provide all required parameters.(i.e: to,form and subject)",
														reference_key: ""
													});
												}
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_402,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Kindly configure your mandrill api key first",
													reference_key: ""
												});
											}

										} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> TEMPLATE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
										else if (email_type == CONST_PARAM.TEMPLATE) {

											var template_name_text = body[j].template_name_text === '' || body[j].template_name_text === undefined ? '' : body[j].template_name_text;
											var template_content_text = body[j].template_content_text === '' || body[j].template_content_text === undefined ? [] : body[j].template_content_text;
											var subject = body[j].subject === '' || body[j].subject === undefined ? '' : body[j].subject;
											var from_email = body[j].from_email === '' || body[j].from_email === undefined ? '' : body[j].from_email;
											var from_name = body[j].from_name === '' || body[j].from_name === undefined ? '' : body[j].from_name;
											var to_email = body[j].to_email === '' || body[j].to_email === undefined ? '' : body[j].to_email;
											var to_name = body[j].to_name === '' || body[j].to_name === undefined ? '' : body[j].to_name;

											// check for mandrill credentials
											if (!!mandrill_credentials.api_key) {
												if (!!from_email && !!to_email && !!subject && !!template_name_text && !!template_content_text) {
													var template_unique_string = 'NE_' + Date.now() + makeid(6);
													// mandrill basic child email
													message_arr.push({
														error: CONST_PARAM.ERROR_0,
														success: CONST_PARAM.SUCCESS_200,
														error_key: "",
														reference_key: template_unique_string
													});
													var childTask = child.fork('./routes/child/template_mandrill.js');
													childTask.send({
														push_type: 'mandrill template',
														required_body: body[j],
														mandrill_api_key: mandrill_credentials.api_key,
														reference_key: template_unique_string
													});
													// end mandrill basic child email
												} else {
													message_arr.push({
														error: CONST_PARAM.ERROR_401,
														success: CONST_PARAM.SUCCESS_0,
														error_key: "Please provide all required parameters.(i.e: to,form,subject,template name and template content)",
														reference_key: ""
													});
												}
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_402,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Kindly configure your mandrill api key first",
													reference_key: ""
												});
											}
										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_400,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Please provide valid mandrill email type",
												reference_key: ""
											});
										}
									}

								} else if (subtype == CONST_PARAM.SENDGRID) {
									// sendgrid
									var sg_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var sg = 0; sg < sg_body.length; sg++) {
										var html_content = sg_body[sg].html_content === '' || sg_body[sg].html_content === undefined ? '' : sg_body[sg].html_content;
										var text_content = sg_body[sg].text_content === '' || sg_body[sg].text_content === undefined ? '' : sg_body[sg].text_content;
										var subject = sg_body[sg].subject === '' || sg_body[sg].subject === undefined ? '' : sg_body[sg].subject;
										var from_email = sg_body[sg].from_email === '' || sg_body[sg].from_email === undefined ? '' : sg_body[sg].from_email;
										var to_email = sg_body[sg].to_email === '' || sg_body[sg].to_email === undefined ? '' : sg_body[sg].to_email;
										// check for mandrill credentials
										if (!!sendgrid_credentials.api_key) {
											if (!!from_email && !!to_email && !!subject && !!html_content && !!text_content) {
												var sg_unique_string = 'NE_' + Date.now() + makeid(6);
												// mandrill basic child email
												message_arr.push({
													error: CONST_PARAM.ERROR_0,
													success: CONST_PARAM.SUCCESS_200,
													error_key: "",
													reference_key: sg_unique_string
												});
												var childTask = child.fork('./routes/child/sendgrid.js');
												childTask.send({
													push_type: 'sendgrid',
													required_body: sg_body[sg],
													sendgrid_api_key: sendgrid_credentials.api_key,
													reference_key: sg_unique_string
												});
												// end mandrill basic child email
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_401,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Please provide all required parameters.(i.e: to,form,subject,html_content and text_content)",
													reference_key: ""
												});
											}
										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_402,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Kindly configure your sendgrid api key first",
												reference_key: ""
											});
										}
									}
								} else {
									message_arr.push({
										error: CONST_PARAM.ERROR_400,
										success: CONST_PARAM.SUCCESS_0,
										error_key: "Please provide default email subtype for onetime category",
										reference_key: ""
									});
								}
							} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SMS TYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
							else if (type == CONST_PARAM.SMS) {
								var subtype = (pushdata[i].push_subtype) ? pushdata[i].push_subtype : DEFAULT_PARAM.DEFAULT_SMS_SUBTYPE;
								/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> TWILIO SUBTYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								if (subtype == CONST_PARAM.TWILIO) {
									
									var accountSid = twilio_credentials.accountSid;
									var authToken = twilio_credentials.authToken;
									
									var sms_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var k = 0; k < sms_body.length; k++) {
										var to_country_code = sms_body[k].to_country_code === '' || sms_body[k].to_country_code === undefined ? '' : sms_body[k].to_country_code;
										var to_number = sms_body[k].to_number === '' || sms_body[k].to_number === undefined ? '' : sms_body[k].to_number;
										var from_country_code = sms_body[k].from_country_code === '' || sms_body[k].from_country_code === undefined ? '' : sms_body[k].from_country_code;
										var from_number = sms_body[k].from_number === '' || sms_body[k].from_number === undefined ? '' : sms_body[k].from_number;
										var message = sms_body[k].message === '' || sms_body[k].message === undefined ? '' : sms_body[k].message;

										if (!!accountSid && !!authToken) {
											if (!!to_country_code && !!to_number && !!from_country_code && !!from_number && !!message) {
												// call sms child file
												var sms_unique_string = 'NE_' + Date.now() + makeid(6);
												message_arr.push({
													error: CONST_PARAM.ERROR_0,
													success: CONST_PARAM.SUCCESS_200,
													error_key: "",
													reference_key: sms_unique_string
												});
												var childTask = child.fork('./routes/child/twilio.js');
												childTask.send({
													push_type: 'twilio sms',
													required_body: sms_body[k],
													reference_key: sms_unique_string
												});
												// end smsm child email
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_401,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Please provide all required parameters(i.e: country code,to number,from country code,from number and message)",
													reference_key: ""
												});
											}
										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_402,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Kindly configure your twilio authentication first",
												reference_key: ""
											});
										}
									}
								} else {
									message_arr.push({
										error: CONST_PARAM.ERROR_400,
										success: CONST_PARAM.SUCCESS_0,
										error_key: "Please provide default sms push subtype for onetime category",
										reference_key: ""
									});
								}

							} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> WEBPUSH TYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
							else if (type == CONST_PARAM.WEBPUSH) {
								var subtype = (pushdata[i].push_subtype) ? pushdata[i].push_subtype : DEFAULT_PARAM.DEFAULT_PUSH_SUBTYPE;
								/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> BASIC >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								if (subtype == CONST_PARAM.BASIC) {
									var web_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var m = 0; m < web_body.length; m++) {
										var html_title = web_body[m].html_title === '' || web_body[m].html_title === undefined ? '' : web_body[m].html_title;
										var html_body = web_body[m].html_body === '' || web_body[m].html_body === undefined ? '' : web_body[m].html_body;
										var user_id = web_body[m].user_id === '' || web_body[m].user_id === undefined ? '' : web_body[m].user_id;

										if (!!html_title && !!html_body && !!user_id) {
											var web_body_data = web_body[m];

											var web_unique_string = 'NE_' + Date.now() + makeid(6);
											message_arr.push({
												error: CONST_PARAM.ERROR_0,
												success: CONST_PARAM.SUCCESS_200,
												error_key: "",
												reference_key: web_unique_string
											});
											// get user subsciption endpoint 
											let selectSql = 'SELECT * FROM `subscription` WHERE `user_id`=?';
											let selectparam = [user_id];
											// select query 
											connection.query(selectSql, selectparam, (err, rows, fields) => {
												if (err) {
													throw err;
													let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
													let insertparams = ['basic webpush', web_unique_string, 'error', err];
													connection.query(insertsql, insertparams, (err, rows, fields) => {
														if (err) {
															throw err;
														} else {
															console.log('basic webpush success log successfully inserted in database');
														}
													});
												} else {
													var subscription_details = rows[0].subscription_data;
													if (!!subscription_details) {
														// call sms child file	
														var childTask = child.fork('./routes/child/basic_webpush.js');
														childTask.send({
															push_type: 'basic webpush',
															required_body: web_body_data,
															reference_key: web_unique_string,
															subscription_details: subscription_details
														});
														// end smsm child email
													} else {
														//message_arr.push({error_key:"No subsciption details not found"});
														let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
														let insertparams = ['basic webpush', web_unique_string, 'error', '{error_key:"No subsciption details not found"}'];
														connection.query(insertsql, insertparams, (err, rows, fields) => {
															if (err) {
																throw err;
															} else {
																console.log('basic webpush success log successfully inserted in database');
															}
														});
													}
												}
											});

										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_401,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Please provide all required parameters(i.e: title,body and user id)",
												reference_key: ""
											});
										}
									}
								} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ADVANCE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								else if (subtype == CONST_PARAM.ADVANCE) {
									// advance
									var adv_web_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var am = 0; am < adv_web_body.length; am++) {

										var html_title = adv_web_body[am].html_title === '' || adv_web_body[am].html_title === undefined ? '' : adv_web_body[am].html_title;
										var html_body = adv_web_body[am].html_body === '' || adv_web_body[am].html_body === undefined ? '' : adv_web_body[am].html_body;
										var user_id = adv_web_body[am].user_id === '' || adv_web_body[am].user_id === undefined ? '' : adv_web_body[am].user_id;
										var icon_url = adv_web_body[am].icon_url === '' || adv_web_body[am].icon_url === undefined ? '' : adv_web_body[am].icon_url;
										var badge_url = adv_web_body[am].badge_url === '' || adv_web_body[am].badge_url === undefined ? '' : adv_web_body[am].badge_url;
										var image_url = adv_web_body[am].image_url === '' || adv_web_body[am].image_url === undefined ? '' : adv_web_body[am].image_url;
										var vibrate = adv_web_body[am].vibrate === '' || adv_web_body[am].vibrate === undefined ? '' : adv_web_body[am].vibrate;
										var sound_url = adv_web_body[am].sound_url === '' || adv_web_body[am].sound_url === undefined ? '' : adv_web_body[am].sound_url;
										var dir = adv_web_body[am].dir === '' || adv_web_body[am].dir === undefined ? '' : adv_web_body[am].dir;
										var actions = adv_web_body[am].actions === '' || adv_web_body[am].actions === undefined ? '' : adv_web_body[am].actions;

										if (!!html_title && !!html_body && !!user_id && !!icon_url && !!badge_url) {
											var adv_web_body_data = adv_web_body[am];

											var adv_web_unique_string = 'NE_' + Date.now() + makeid(6);
											message_arr.push({
												error: CONST_PARAM.ERROR_0,
												success: CONST_PARAM.SUCCESS_200,
												error_key: "",
												reference_key: adv_web_unique_string
											});
											// get user subsciption endpoint 
											let selectSql = 'SELECT * FROM `subscription` WHERE `user_id`=?';
											let selectparam = [user_id];
											// select query 
											connection.query(selectSql, selectparam, (err, rows, fields) => {
												if (err) {
													throw err;
													let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
													let insertparams = ['advance webpush', adv_web_unique_string, 'error', err];
													connection.query(insertsql, insertparams, (err, rows, fields) => {
														if (err) {
															throw err;
														} else {
															console.log('advance webpush success log successfully inserted in database');
														}
													});
												} else {
													var subscription_details = rows[0].subscription_data;
													if (!!subscription_details) {
														// call sms child file	
														var childTask = child.fork('./routes/child/advance_webpush.js');
														childTask.send({
															push_type: 'advance webpush',
															required_body: adv_web_body_data,
															reference_key: adv_web_unique_string,
															subscription_details: subscription_details
														});
														// end smsm child email
													} else {
														//message_arr.push({error_key:"No subsciption details not found"});
														let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
														let insertparams = ['advance webpush', adv_web_unique_string, 'error', '{error_key:"No subsciption details not found"}'];
														connection.query(insertsql, insertparams, (err, rows, fields) => {
															if (err) {
																throw err;
															} else {
																console.log('advance webpush success log successfully inserted in database');
															}
														});
													}
												}
											});

										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_401,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Please provide all required parameters(i.e: title,body,user_id,icon_url and badge_url)",
												reference_key: ""
											});
										}
									}
									//end advance
								} else {
									message_arr.push({
										error: CONST_PARAM.ERROR_400,
										success: CONST_PARAM.SUCCESS_0,
										error_key: "Please provide default web push subtype for onetime category",
										reference_key: ""
									});
								}

							} else {
								message_arr.push({
									error: CONST_PARAM.ERROR_400,
									success: CONST_PARAM.SUCCESS_0,
									error_key: "Please provide valid push type for onetime category",
									reference_key: ""
								});
							}

						} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SCHEDULE CATEGORY >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
						else if (category == CONST_PARAM.SCHEDULE) {
							// send notification schedule
							var type = (pushdata[i].push_type) ? pushdata[i].push_type : DEFAULT_PARAM.DEFAULT_TYPE;
							/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> EMAIL TYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
							if (type == CONST_PARAM.EMAIL) {
								var subtype = (pushdata[i].push_subtype) ? pushdata[i].push_subtype : DEFAULT_PARAM.DEFAULT_EMAIL_SUBTYPE;
								/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> MANDRILL SUBTYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								if (subtype == CONST_PARAM.MANDRILL) {
									var skd_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var sj = 0; sj < skd_body.length; sj++) {
										var email_type = (skd_body[sj].email_type) ? skd_body[sj].email_type : '';
										/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> BASIC >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
										if (email_type == CONST_PARAM.BASIC) {
											var html_content = skd_body[sj].html_content === '' || skd_body[sj].html_content === undefined ? '' : skd_body[sj].html_content;
											var text_content = skd_body[sj].text_content === '' || skd_body[sj].text_content === undefined ? '' : skd_body[sj].text_content;
											var subject = skd_body[sj].subject === '' || skd_body[sj].subject === undefined ? '' : skd_body[sj].subject;
											var from_email = skd_body[sj].from_email === '' || skd_body[sj].from_email === undefined ? '' : skd_body[sj].from_email;
											var from_name = skd_body[sj].from_name === '' || skd_body[sj].from_name === undefined ? '' : skd_body[sj].from_name;
											var to_email = skd_body[sj].to_email === '' || skd_body[sj].to_email === undefined ? '' : skd_body[sj].to_email;
											var to_name = skd_body[sj].to_name === '' || skd_body[sj].to_name === undefined ? '' : skd_body[sj].to_name;
											var schedule_time = skd_body[sj].schedule_time === '' || skd_body[sj].schedule_time === undefined ? '' : skd_body[sj].schedule_time;
											// check for mandrill credentials
											if (!!mandrill_credentials.api_key) {
												if (!!from_email && !!to_email && !!subject && !!schedule_time) {

													var skd_body_data = skd_body[sj];
													var skd_basic_unique_string = 'NE_' + Date.now() + makeid(6);
													message_arr.push({
														error: CONST_PARAM.ERROR_0,
														success: CONST_PARAM.SUCCESS_200,
														error_key: "",
														reference_key: skd_basic_unique_string
													});
													//create log before schedule began
													let sql1 = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
													let params1 = ['schedule mandrill basic', skd_basic_unique_string, 'scheduled', '{}'];
													connection.query(sql1, params1, (err1, rows1, fields1) => {
														if (err1) {
															throw err1;
														} else {
															/*------------------------- schedule job ------------------------------*/
															schedule.scheduleJob(skd_basic_unique_string, schedule_time, function () {
																// mandrill basic child email												
																var childTask = child.fork('./routes/child/basic_mandrill.js');
																childTask.send({
																	push_type: 'schedule mandrill basic',
																	required_body: skd_body_data,
																	mandrill_api_key: mandrill_credentials.api_key,
																	reference_key: skd_basic_unique_string
																});
																// end mandrill basic child email
															});
														}
													});

												} else {
													message_arr.push({
														error: CONST_PARAM.ERROR_401,
														success: CONST_PARAM.SUCCESS_0,
														error_key: "Please provide all required parameters.(i.e: to,form,subject and schedule time )",
														reference_key: ""
													});
												}
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_402,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Kindly configure your mandrill api key first",
													reference_key: ""
												});
											}
										} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> TEMPLATE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
										else if (email_type == CONST_PARAM.TEMPLATE) {
											var template_name_text = skd_body[sj].template_name_text === '' || skd_body[sj].template_name_text === undefined ? '' : skd_body[sj].template_name_text;
											var template_content_text = skd_body[sj].template_content_text === '' || skd_body[sj].template_content_text === undefined ? [] : skd_body[sj].template_content_text;
											var subject = skd_body[sj].subject === '' || skd_body[sj].subject === undefined ? '' : skd_body[sj].subject;
											var from_email = skd_body[sj].from_email === '' || skd_body[sj].from_email === undefined ? '' : skd_body[sj].from_email;
											var from_name = skd_body[sj].from_name === '' || skd_body[sj].from_name === undefined ? '' : skd_body[sj].from_name;
											var to_email = skd_body[sj].to_email === '' || skd_body[sj].to_email === undefined ? '' : skd_body[sj].to_email;
											var to_name = skd_body[sj].to_name === '' || skd_body[sj].to_name === undefined ? '' : skd_body[sj].to_name;
											var schedule_time = skd_body[sj].schedule_time === '' || skd_body[sj].schedule_time === undefined ? '' : skd_body[sj].schedule_time;
											// check for mandrill credentials
											if (!!mandrill_credentials.api_key) {
												if (!!from_email && !!to_email && !!subject && !!schedule_time) {

													var skd_body_data = skd_body[sj];
													var skd_template_unique_string = 'NE_' + Date.now() + makeid(6);
													message_arr.push({
														error: CONST_PARAM.ERROR_0,
														success: CONST_PARAM.SUCCESS_200,
														error_key: "",
														reference_key: skd_template_unique_string
													});
													//create log before schedule began
													let sql1 = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
													let params1 = ['schedule mandrill template', skd_template_unique_string, 'scheduled', '{}'];
													connection.query(sql1, params1, (err1, rows1, fields1) => {
														if (err1) {
															throw err1;
														} else {
															/*------------------------- schedule job ------------------------------*/
															schedule.scheduleJob(skd_template_unique_string, schedule_time, function () {
																// mandrill basic child email												
																var childTask = child.fork('./routes/child/template_mandrill.js');
																childTask.send({
																	push_type: 'schedule mandrill template',
																	required_body: skd_body_data,
																	mandrill_api_key: mandrill_credentials.api_key,
																	reference_key: skd_template_unique_string
																});
																// end mandrill basic child email
															});
														}
													});

												} else {
													message_arr.push({
														error: CONST_PARAM.ERROR_401,
														success: CONST_PARAM.SUCCESS_0,
														error_key: "Please provide all required parameters.(i.e: to,form,subject and schedule time )",
														reference_key: ""
													});
												}
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_402,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Kindly configure your mandrill api key first",
													reference_key: ""
												});
											}
										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_400,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Please provide valid mandrill email type for schedule category",
												reference_key: ""
											});
										}

									}
								} else if (subtype == CONST_PARAM.SENDGRID) {
									// sendgrid
									var skd_sg_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var ssg = 0; ssg < skd_sg_body.length; ssg++) {
										var html_content = skd_sg_body[ssg].html_content === '' || skd_sg_body[ssg].html_content === undefined ? '' : skd_sg_body[ssg].html_content;
										var text_content = skd_sg_body[ssg].text_content === '' || skd_sg_body[ssg].text_content === undefined ? '' : skd_sg_body[ssg].text_content;
										var subject = skd_sg_body[ssg].subject === '' || skd_sg_body[ssg].subject === undefined ? '' : skd_sg_body[ssg].subject;
										var from_email = skd_sg_body[ssg].from_email === '' || skd_sg_body[ssg].from_email === undefined ? '' : skd_sg_body[ssg].from_email;
										var to_email = skd_sg_body[ssg].to_email === '' || skd_sg_body[ssg].to_email === undefined ? '' : skd_sg_body[ssg].to_email;
										var schedule_time = skd_sg_body[ssg].schedule_time === '' || skd_sg_body[ssg].schedule_time === undefined ? '' : skd_sg_body[ssg].schedule_time;
										// check for mandrill credentials
										if (!!sendgrid_credentials.api_key) {
											if (!!from_email && !!to_email && !!subject && !!html_content && !!text_content && !!schedule_time) {
												var skd_sg_unique_string = 'NE_' + Date.now() + makeid(6);
												// mandrill basic child email
												message_arr.push({
													error: CONST_PARAM.ERROR_0,
													success: CONST_PARAM.SUCCESS_200,
													error_key: "",
													reference_key: skd_sg_unique_string
												});
												//create log before schedule began
												let sql1 = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
												let params1 = ['schedule sendgrid', skd_sg_unique_string, 'scheduled', '{}'];
												connection.query(sql1, params1, (err1, rows1, fields1) => {
													if (err1) {
														throw err1;
													} else {
														/*------------------------- schedule job ------------------------------*/
														schedule.scheduleJob(skd_sg_unique_string, schedule_time, function () {
															// sendgrid child email												
															var childTask = child.fork('./routes/child/sendgrid.js');
															childTask.send({
																push_type: 'schedule sendgrid',
																required_body: skd_sg_body[ssg],
																sendgrid_api_key: sendgrid_credentials.api_key,
																reference_key: skd_sg_unique_string
															});
															// end mandrill basic child email
														});
													}
												});
												// end sendgrid child email
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_401,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Please provide all required parameters.(i.e: to,form,subject,html_content,text_content and schedule_time)",
													reference_key: ""
												});
											}
										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_402,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Kindly configure your sendgrid api key first",
												reference_key: ""
											});
										}
									}
								} else {
									message_arr.push({
										error: CONST_PARAM.ERROR_400,
										success: CONST_PARAM.SUCCESS_0,
										error_key: "Please provide valid email push subtype for schedule category",
										reference_key: ""
									});
								}
							} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SMS TYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
							else if (type == CONST_PARAM.SMS) {
								var subtype = (pushdata[i].push_subtype) ? pushdata[i].push_subtype : DEFAULT_PARAM.DEFAULT_SMS_SUBTYPE;
								/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> TWILIO SUBTYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								if (subtype == CONST_PARAM.TWILIO) {
									
									var accountSid = twilio_credentials.accountSid;
									var authToken = twilio_credentials.authToken;
									
									var skd_sms_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var sk = 0; sk < skd_sms_body.length; sk++) {
										var to_country_code = skd_sms_body[sk].to_country_code === '' || skd_sms_body[sk].to_country_code === undefined ? '' : skd_sms_body[sk].to_country_code;
										var to_number = skd_sms_body[sk].to_number === '' || skd_sms_body[sk].to_number === undefined ? '' : skd_sms_body[sk].to_number;
										var from_country_code = skd_sms_body[sk].from_country_code === '' || skd_sms_body[sk].from_country_code === undefined ? '' : skd_sms_body[sk].from_country_code;
										var from_number = skd_sms_body[sk].from_number === '' || skd_sms_body[sk].from_number === undefined ? '' : skd_sms_body[sk].from_number;
										var message = skd_sms_body[sk].message === '' || skd_sms_body[sk].message === undefined ? '' : skd_sms_body[sk].message;
										var schedule_time = skd_sms_body[sk].schedule_time === '' || skd_sms_body[sk].schedule_time === undefined ? '' : skd_sms_body[sk].schedule_time;

										if (!!accountSid && !!authToken) {
											if (!!to_country_code && !!to_number && !!from_country_code && !!from_number && !!message && !!schedule_time) {

												var skd_sms_body_data = skd_sms_body[sk];
												var skd_sms_unique_string = 'NE_' + Date.now() + makeid(6);
												message_arr.push({
													error: CONST_PARAM.ERROR_0,
													success: CONST_PARAM.SUCCESS_200,
													error_key: "",
													reference_key: skd_sms_unique_string
												});
												//create log before schedule began
												let sql1 = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
												let params1 = ['schedule twilio sms', skd_sms_unique_string, 'scheduled', '{}'];
												connection.query(sql1, params1, (err1, rows1, fields1) => {
													if (err1) {
														throw err1;
													} else {
														/*------------------------- schedule job ------------------------------*/
														schedule.scheduleJob(skd_sms_unique_string, schedule_time, function () {
															// call sms child file	
															var childTask = child.fork('./routes/child/twilio.js');
															childTask.send({
																push_type: 'schedule twilio sms',
																required_body: skd_sms_body_data,
																reference_key: skd_sms_unique_string
															});
															// end smsm child email
														});
													}
												});
											} else {
												message_arr.push({
													error: CONST_PARAM.ERROR_401,
													success: CONST_PARAM.SUCCESS_0,
													error_key: "Please provide all required parameters(i.e: country code,to number,from country code,from number,message and schedule time)",
													reference_key: ""
												});
											}
										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_402,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Kindly configure your twilio authentication first",
												reference_key: ""
											});
										}
									}
								} else {
									message_arr.push({
										error: CONST_PARAM.ERROR_400,
										success: CONST_PARAM.SUCCESS_0,
										error_key: "Please provide default sms push subtype for schedule",
										reference_key: ""
									});
								}

							} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> WEBPUSH TYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
							else if (type == CONST_PARAM.WEBPUSH) {
								var subtype = (pushdata[i].push_subtype) ? pushdata[i].push_subtype : DEFAULT_PARAM.DEFAULT_PUSH_SUBTYPE;
								/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> BASIC SUBTYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								if (subtype == CONST_PARAM.BASIC) {
									var skd_web_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var sm = 0; sm < skd_web_body.length; sm++) {

										var html_title = skd_web_body[sm].html_title === '' || skd_web_body[sm].html_title === undefined ? '' : skd_web_body[sm].html_title;
										var html_body = skd_web_body[sm].html_body === '' || skd_web_body[sm].html_body === undefined ? '' : skd_web_body[sm].html_body;
										var schedule_time = skd_web_body[sm].schedule_time === '' || skd_web_body[sm].schedule_time === undefined ? '' : skd_web_body[sm].schedule_time;
										var user_id = skd_web_body[sm].user_id === '' || skd_web_body[sm].user_id === undefined ? '' : skd_web_body[sm].user_id;

										if (!!html_title && !!html_body && !!schedule_time && !!user_id) {
											var skd_web_body_data = skd_web_body[sm];
											var skd_web_unique_string = 'NE_' + Date.now() + makeid(6);
											message_arr.push({
												error: CONST_PARAM.ERROR_0,
												success: CONST_PARAM.SUCCESS_200,
												error_key: "",
												reference_key: skd_web_unique_string
											});
											// get user subsciption endpoint 
											let selectSql = 'SELECT * FROM `subscription` WHERE `user_id`=?';
											let selectparam = [user_id];
											// select query 
											connection.query(selectSql, selectparam, (err, rows, fields) => {
												if (err) {
													throw err;
													let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
													let insertparams = ['schedule webpush', skd_web_unique_string, 'error', err];
													connection.query(insertsql, insertparams, (err, rows, fields) => {
														if (err) {
															throw err;
														} else {
															console.log('schedule webpush success log successfully inserted in database');
														}
													});
												} else {
													var subscription_details = rows[0].subscription_data;
													if (!!subscription_details) {
														//create log before schedule began
														let sql1 = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
														let params1 = ['schedule webpush', skd_web_unique_string, 'scheduled', '{}'];
														connection.query(sql1, params1, (err1, rows1, fields1) => {
															if (err1) {
																throw err1;
															} else {
																/*------------------------- schedule job ------------------------------*/
																schedule.scheduleJob(skd_web_unique_string, schedule_time, function (res) {
																	// call sms child file	
																	var childTask = child.fork('./routes/child/basic_webpush.js');
																	childTask.send({
																		push_type: 'schedule webpush',
																		required_body: skd_web_body_data,
																		reference_key: skd_web_unique_string,
																		subscription_details: subscription_details
																	});
																	// end smsm child email
																});

															}
														});

													} else {
														//message_arr.push({error_key:"No subsciption details not found"});
														let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
														let insertparams = ['schedule webpush', skd_web_unique_string, 'error', '{error_key:"No subsciption details not found"}'];
														connection.query(insertsql, insertparams, (err, rows, fields) => {
															if (err) {
																throw err;
															} else {
																console.log('schedule webpush success log successfully inserted in database');
															}
														});
													}
												}
											});

										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_401,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Please provide all required parameters.(i.e: title,body,user id and schedule time)",
												reference_key: ""
											});
										}
									}
								} /*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ADVANCE SUBTYPE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
								else if (subtype == CONST_PARAM.ADVANCE) {
									var skd_adv_web_body = (pushdata[i].push_body) ? pushdata[i].push_body : '';
									for (var sam = 0; sam < skd_adv_web_body.length; sam++) {

										var html_title = skd_adv_web_body[sam].html_title === '' || skd_adv_web_body[sam].html_title === undefined ? '' : skd_adv_web_body[sam].html_title;
										var html_body = skd_adv_web_body[sam].html_body === '' || skd_adv_web_body[sam].html_body === undefined ? '' : skd_adv_web_body[sam].html_body;
										var schedule_time = skd_adv_web_body[sam].schedule_time === '' || skd_adv_web_body[sam].schedule_time === undefined ? '' : skd_adv_web_body[sam].schedule_time;
										var user_id = skd_adv_web_body[sam].user_id === '' || skd_adv_web_body[sam].user_id === undefined ? '' : skd_adv_web_body[sam].user_id;
										var icon_url = skd_adv_web_body[sam].icon_url === '' || skd_adv_web_body[sam].icon_url === undefined ? '' : skd_adv_web_body[sam].icon_url;
										var badge_url = skd_adv_web_body[sam].badge_url === '' || skd_adv_web_body[sam].badge_url === undefined ? '' : skd_adv_web_body[sam].badge_url;
										var image_url = skd_adv_web_body[sam].image_url === '' || skd_adv_web_body[sam].image_url === undefined ? '' : skd_adv_web_body[sam].image_url;
										var vibrate = skd_adv_web_body[sam].vibrate === '' || skd_adv_web_body[sam].vibrate === undefined ? '' : skd_adv_web_body[sam].vibrate;
										var sound_url = skd_adv_web_body[sam].sound_url === '' || skd_adv_web_body[sam].sound_url === undefined ? '' : skd_adv_web_body[sam].sound_url;
										var dir = skd_adv_web_body[sam].dir === '' || skd_adv_web_body[sam].dir === undefined ? '' : skd_adv_web_body[sam].dir;
										var actions = skd_adv_web_body[sam].actions === '' || skd_adv_web_body[sam].actions === undefined ? '' : skd_adv_web_body[sam].actions;

										if (!!html_title && !!html_body && !!schedule_time && !!user_id && !!icon_url && !!badge_url) {
											var skd_adv_web_body_data = skd_adv_web_body[sam];
											var skd_adv_web_unique_string = 'NE_' + Date.now() + makeid(6);
											message_arr.push({
												error: CONST_PARAM.ERROR_0,
												success: CONST_PARAM.SUCCESS_200,
												error_key: "",
												reference_key: skd_adv_web_unique_string
											});
											// get user subsciption endpoint 
											let selectSql = 'SELECT * FROM `subscription` WHERE `user_id`=?';
											let selectparam = [user_id];
											// select query 
											connection.query(selectSql, selectparam, (err, rows, fields) => {
												if (err) {
													throw err;
													let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
													let insertparams = ['schedule advance webpush', skd_adv_web_unique_string, 'error', err];
													connection.query(insertsql, insertparams, (err, rows, fields) => {
														if (err) {
															throw err;
														} else {
															console.log('schedule advance webpush success log successfully inserted in database');
														}
													});
												} else {
													var subscription_details = rows[0].subscription_data;
													if (!!subscription_details) {
														//create log before schedule began
														let sql1 = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
														let params1 = ['schedule advance webpush', skd_adv_web_unique_string, 'scheduled', '{}'];
														connection.query(sql1, params1, (err1, rows1, fields1) => {
															if (err1) {
																throw err1;
															} else {
																/*------------------------- schedule job ------------------------------*/
																schedule.scheduleJob(skd_adv_web_unique_string, schedule_time, function (res) {
																	// call sms child file	
																	var childTask = child.fork('./routes/child/advance_webpush.js');
																	childTask.send({
																		push_type: 'schedule advance webpush',
																		required_body: skd_adv_web_body_data,
																		reference_key: skd_adv_web_unique_string,
																		subscription_details: subscription_details
																	});
																	// end smsm child email
																});

															}
														});

													} else {
														//message_arr.push({error_key:"No subsciption details not found"});
														let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
														let insertparams = ['schedule advance webpush', skd_adv_web_unique_string, 'error', '{error_key:"No subsciption details not found"}'];
														connection.query(insertsql, insertparams, (err, rows, fields) => {
															if (err) {
																throw err;
															} else {
																console.log('schedule advance webpush success log successfully inserted in database');
															}
														});
													}
												}
											});

										} else {
											message_arr.push({
												error: CONST_PARAM.ERROR_401,
												success: CONST_PARAM.SUCCESS_0,
												error_key: "Please provide all required parameters.(i.e: title,body,user_id,schedule time, icon_url and badge_url)",
												reference_key: ""
											});
										}
									}
								} else {
									message_arr.push({
										error: CONST_PARAM.ERROR_400,
										success: CONST_PARAM.SUCCESS_0,
										error_key: "Please provide default web push subtype for schedule category",
										reference_key: ""
									});
								}

							} else {
								message_arr.push({
									error: CONST_PARAM.ERROR_400,
									success: CONST_PARAM.SUCCESS_0,
									error_key: "Please provide valid push type for schedule category",
									reference_key: ""
								});
							}
						} else {
							message_arr.push({
								error: CONST_PARAM.ERROR_400,
								success: CONST_PARAM.SUCCESS_0,
								error_key: "Please provide valid push category",
								reference_key: ""
							});
						}
					} else {
						message_arr.push({
							error: CONST_PARAM.ERROR_401,
							success: CONST_PARAM.SUCCESS_0,
							error_key: "Push category is required",
							reference_key: ""
						});
					}
					//PASS MESSAGE ARRAY IN BODY
					data['body'] = message_arr;
				}
				//PASS DATA IN FINAL RESPONSE ARRAY
				response_arr.push(data);
				res.jsonp(response_arr);
			} else {
				// pushdata empty
				data["error"] = CONST_PARAM.ERROR_400;
				data["success"] = CONST_PARAM.SUCCESS_0;
				data["message"] = "empty json array";
				data["body"] = {};
				res.jsonp(data);
			}
		} catch (ex) {
			// pushdata empty
			data["error"] = CONST_PARAM.ERROR_400;
			data["success"] = CONST_PARAM.SUCCESS_0;
			data["message"] = "something went wrong...";
			data["body"] = {};
			res.jsonp(data);
		}

	});
	/*-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	 *-- Date - 16th jan 2020
	 *-- Function : Function to cancel scheduled notification
	 *-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
	router.post('/cancel_schedule', (req, res) => {

		var reference_key = req.body.reference_key === '' || req.body.reference_key === undefined ? '' : req.body.reference_key;
		var data = {
			'error': CONST_PARAM.ERROR_400,
			'body': ""
		};
		if (!!reference_key) {

			var cancel_job_name = schedule.scheduledJobs[reference_key];
			if (!!cancel_job_name) {
				// if job exist - cancel it
				try {

					cancel_job_name.cancel();
					let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
					let insertparams = ['cancel push', reference_key, 'cancelled', '{}'];
					connection.query(insertsql, insertparams, (err1, rows1, fields1) => {
						if (err1) {
							throw err1;
							data["error"] = CONST_PARAM.ERROR_400;
							data["success"] = CONST_PARAM.SUCCESS_0;
							data["body"] = err1;
							res.jsonp(data);
						} else {
							data["error"] = CONST_PARAM.ERROR_0;
							data["success"] = CONST_PARAM.SUCCESS_200;
							data["body"] = reference_key + ' scheduled notification has being canceled';
							res.jsonp(data);
						}
					});
				} catch (ex) {
					let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
					let insertparams = ['cancel push', reference_key, 'error', '{error_key:"Error in canceling schedule job"}'];
					connection.query(insertsql, insertparams, (err1, rows1, fields1) => {
						if (err1) {
							throw err1;
							data["error"] = CONST_PARAM.ERROR_400;
							data["success"] = CONST_PARAM.SUCCESS_0;
							data["body"] = err1;
							res.jsonp(data);
						} else {
							data["error"] = CONST_PARAM.ERROR_0;
							data["success"] = CONST_PARAM.SUCCESS_200;
							data["body"] = 'error in canceling is scheduled job with key - ' + reference_key + '';
							res.jsonp(data);
						}
					});
				}

			} else {
				let insertsql = 'INSERT INTO `push_logs`(`push_type`, `reference_key`, `status`, `json_respone`) VALUES (?,?,?,?)';
				let insertparams = ['cancel push', reference_key, 'error', '{error_key:"This schedule job is either cancelled or does not exist"}'];
				connection.query(insertsql, insertparams, (err1, rows1, fields1) => {
					if (err1) {
						throw err1;
						data["error"] = CONST_PARAM.ERROR_400;
						data["success"] = CONST_PARAM.SUCCESS_0;
						data["body"] = err1;
						res.jsonp(data);
					} else {
						data["error"] = CONST_PARAM.ERROR_0;
						data["success"] = CONST_PARAM.SUCCESS_200;
						data["body"] = 'No job is scheduled with key - ' + reference_key + '';
						res.jsonp(data);
					}
				});
			}

		} else {
			data["error"] = CONST_PARAM.ERROR_400;
			data["success"] = CONST_PARAM.SUCCESS_0;
			data["body"] = "Please provide all required parameters.";
			res.jsonp(data);
		}

	});
	/*-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
	 *-- Date - 20th jan 2020
	 *-- Function : Function to check push status
	 *-->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
	router.post('/check_status', (req, res) => {

		var reference_key = req.body.reference_key === '' || req.body.reference_key === undefined ? '' : req.body.reference_key;
		var data = {
			'error': CONST_PARAM.ERROR_400,
			'body': ""
		};
		console.log(req.body.reference_key);
		if (!!reference_key) {
			let sql = 'SELECT * FROM `push_logs` WHERE `reference_key`= ? ORDER BY id DESC LIMIT 1';
			let param = [reference_key];
			// select query 
			connection.query(sql, param, (err, rows, fields) => {
				if (err) {
					throw err;
					data["error"] = CONST_PARAM.ERROR_400;
					data["success"] = CONST_PARAM.SUCCESS_0;
					data["body"] = err;
					res.jsonp(data);
				} else {
					data["error"] = CONST_PARAM.ERROR_0;
					data["success"] = CONST_PARAM.SUCCESS_200;
					data["body"] = rows;
					res.jsonp(data);
				}
			});

		} else {
			data["error"] = CONST_PARAM.ERROR_400;
			data["success"] = CONST_PARAM.SUCCESS_0;
			data["body"] = "Please provide all required parameters.";
			res.jsonp(data);
		}

	});
	//************************ FUNCTION TO GENERATE UNIQUE STRING *************************//
	function makeid(length) {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
	//**************************************** END **************************************//
	return router;
};
