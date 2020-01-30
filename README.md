DATABASE :

## create these tables database
-- --------------------------------------------------------

--
-- Table structure for table `push_data`
--

CREATE TABLE `push_data` (
  `id` int(11) NOT NULL,
  `push_category` varchar(250) NOT NULL,
  `push_type` varchar(250) NOT NULL,
  `push_subtype` varchar(250) NOT NULL,
  `push_body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `push_logs`
--

CREATE TABLE `push_logs` (
  `id` int(11) NOT NULL,
  `push_type` varchar(250) NOT NULL,
  `reference_key` varchar(250) NOT NULL,
  `status` varchar(250) NOT NULL,
  `json_respone` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `subscription`
--

CREATE TABLE `subscription` (
  `id` int(11) NOT NULL,
  `subscription_data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ------------------------------------------------------------------------------------------------------


CONFIGRATION 

1. DATABASE
	- keep your host, username , password and database name in db_credentials file
2. MANDRILL
	- keep your api key in mandrill_credentials file
3. TWILIO
	- keep your accountSid and authToken in twilio_credentials file
4. WEBPUSH
	//Installl web push module
	npm install web-push --save

	//Generate VAPID keys by console
	cd ./node_modules/.bin/web-push generate-vapid-keys

	- Generate publicVapidKey and privateVapidKey from terminal 
	- keep public and private key in webpush_credentials file
	- give public key in public/main.js file
5. DEFAULT
	- Mention default category , type and subtype

-- ------------------------------------------------------------------------------------------------------
PARAMETERS :
=============================================
MANDRILL BODY PARAMETERS:
- email_type				-	"<String>"
- html_content				-	"<String>"
- text_content				-	"<String>"
- subject		(REQUIRED)	-	"<String>"
- from_email		(REQUIRED)	-	"<email>"
- from_name				-	"<String>"
- to_email		(REQUIRED)	-	"<Email>"
- to_name				-	"<String>"

- schedule_time (REQUIRED) (* IN CASE OF SCHEDULE CATEGORY )
============================================
SENDGRID BODY PARAMETERS:
- html_content		(REQUIRED)	-	"<String>"
- text_content		(REQUIRED)	-	"<String>"
- subject		(REQUIRED)	-	"<String>"
- from_email		(REQUIRED)	-	"<email>"
- to_email		(REQUIRED)	-	"<email>"

- schedule_time (REQUIRED) (* IN CASE OF SCHEDULE CATEGORY )
===========================================
TWILIO BODY PARAMETERS:
- to_country_code	(REQUIRED)	-	"<integer>"
- to_number		(REQUIRED)	-	"<integer>"
- from_country_code 	(REQUIRED)	-	"<integer>"
- from_number		(REQUIRED)	-	"<integer>"
- message		(REQUIRED)	-	"<String>"

- schedule_time (REQUIRED) (* IN CASE OF SCHEDULE CATEGORY )
===========================================
BASIC WEBPUSH BODY PARAMETERS:
- html_title		(REQUIRED)	-	"<String>"
- html_body		(REQUIRED)	-	"<String>"
- user_id		(REQUIRED)	-	"<integer>"

- schedule_time (REQUIRED) (* IN CASE OF SCHEDULE CATEGORY )
===========================================
ADVANCE WEBPUSH BODY PARAMETERS:
- html_title		(REQUIRED)	-	"<String>"
- html_body		(REQUIRED)	-	"<String>"
- user_id		(REQUIRED)	- 	"<integer>"
- icon_url 		(REQUIRED)	- 	"<URL String>"
- badge_url 		(REQUIRED)	-	"<URL String>"
- image_url 				- 	"<URL String>"
- vibrate				- 	"<Array of Integers>"
- sound_url				- 	"<URL String>"
- dir					- 	"<String of 'auto' | 'ltr' | 'rtl'>"	
- actions				- 	"<Array of Strings>"

- schedule_time (REQUIRED) (* IN CASE OF SCHEDULE CATEGORY )
-- --------------------------------------------------------------------------------------------------------

API DOCUMENT 

1.SEND PUSH NOTIFICATION 
===========================================

URL : BASE_URL:7000/notification/send
METHOD : POST
PARAMETERS : 
	-> Required
		- pushdata 	(json array)
(ex:	   
	pushdata 	= [
		{
	        "push_category":"onetime",
	        "push_type":"email",
	        "push_subtype":"mandrill",
	        "push_body":[{
	        	  "email_type":"basic",	
	              "html_content": "<p>Example HTML FINAL</p>",
	              "text_content":"",
	              "subject":"child bimquote testing",
	              "from_email":"tjd@bimquote.com",
	              "from_name":"tjd",
	              "to_email":"ypooja@teqmavens.com",
	              "to_name":"pooja"
	        },
	        {
	        	  "email_type":"template",	
	        	  "template_name_text":"",
	        	  "template_content_text":"Send Invitation",
	              "html_content": "<p>Example HTML</p>",
	              "text_content":"",
	              "subject":"wow! template attached",
	              "from_email":"tjd@bimquote.com",
	              "from_name":"tjd",
	              "to_email":"kjasvinder@teqmavens.com",
	              "to_name":"jasvinder"
	        }]
	    },
	    {
	    	"push_category":"onetime",
	        "push_type":"sms",
	        "push_subtype":"twilio",
	        "push_body":[{		        	  
	              "to_country_code": "91",
	              "to_number":"7837136128",
	              "from_country_code":"1",
	              "from_number":"5005550006",
	              "message":"this is child test message"
	        }]
	    },
	    {
	    	"push_category":"onetime",
	        "push_subcategory":"",
	        "push_type":"sms",
	        "push_subtype":"twilio",
	        "push_body":[{		        	  
	              "to_country_code": "91",
	              "to_number":"8284996718",
	              "from_country_code":"1",
	              "from_number":"5005550006",
	              "message":"this is child test message"
	        }]
	    },
		{
	    	"push_category":"onetime",
	        "push_type":"webpush",
	        "push_subtype":"basic",
	        "push_body":[{		  
	              "user_id": "4",
	              "html_title":"basic title",
	              "html_body":"basic onetime body"
	        }]
	    },
	    {
	    	"push_category":"schedule",
	        "push_type":"webpush",
	        "push_subtype":"basic",
	        "push_body":[{		  
	              "schedule_time":"*/30 * * * * *",
	              "user_id": "4",
	              "html_title":"Notification engine",
	              "html_body":"YOU FINALLY DID IT,, girl ....."
	        }]
	    },
		{
	        "push_category":"onetime",
	        "push_type":"email",
	        "push_subtype":"sendgrid",
	        "push_body":[{
	              "html_content": "<h1>it works ...and easy to do anywhere, even with Node.js</h1>",
	              "text_content":"and easy to do anywhere, even with Node.js",
	              "subject":"Sending email with Twilio SendGrid is Fun testing....",
	              "from_email":"kgaurav@teqmavens.com",
	              "to_email":"ypooja@teqmavens.com",
	        }]
	    },
	];
)
/****************************************************************************************************/

2.CANCEL PUSH NOTIFICATION 
------------------------------------------
URL : BASE_URL:7000/notification/cancel_schedule
METHOD : POST
PARAMETERS : 
	-> Required
		- reference_key 	

/****************************************************************************************************/

3.CHECK PUSH STATUS 
------------------------------------------
URL : BASE_URL:7000/notification/check_status
METHOD : POST
PARAMETERS : 
	-> Required
		- reference_key 

/****************************************************************************************************/
