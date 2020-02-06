/*
 *
 *  Push Notifications codelab
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

/* eslint-env browser, es6 */

'use strict';

const applicationServerPublicKey = '<YOUR_PUBLIC_VAPID_KEY>';
const sw_url = '<COMPLETE_PATH_OF_SW.js_FILE>';
const api_url = '<COMPLETE_PATH_OF_CONTROLLER_FUNCTION_WHICH_CALL_WEBPUSH_API>';

let isSubscribed = false;
let isSubscribedDelay = false;
let swRegistration = null;

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 *-- convert base 64 string to uint8array
 *>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function urlB64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/\-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 *-- register service worker on browser and check if push is supported 
 *>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
$(document).ready(function () {
	if ('serviceWorker' in navigator && 'PushManager' in window) {
		//if(process.env.NODE_ENV === 'production'){
		console.log('Service Worker and Push is supported');
		navigator.serviceWorker.register(sw_url)
			.then(function (swReg) {

				console.log('Service Worker is registered', swReg);
				swRegistration = swReg;
				initializeUI();
			})
			.catch(function (error) {
				console.error('Service Worker Error', error);
			});
	} else {
		console.warn('Push messaging is not supported');
	}
});
/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 *-- click event to check if the user is currently subscribed
 *>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function initializeUI() {
	// trigger push notification on button click
	if (isSubscribed) {
		//unsubscribeUser();
	} else {
		subscribeUser();
	}
	// Set the initial subscription value
	swRegistration.pushManager.getSubscription()
		.then(function (subscription) {
			isSubscribed = !(subscription === null);
			isSubscribedDelay = !(subscription === null);

			if (isSubscribed) {
				console.log('User IS subscribed.');
			} else {
				console.log('User is NOT subscribed.');
			}
		});
}
/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 *-- if User is subscribed send then push notification 
 *>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function subscribeUser() {

	const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
	swRegistration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: applicationServerKey
		})
		.then(function (subscription) {

			console.log('User is subscribed.');
			// do your stuff here
			updateSubscriptionOnServer(subscription);
			//send push notification
			fetch(api_url, {
				method: 'POST',				
				body: JSON.stringify(subscription),
				headers: {
					'content-type': 'application/json'
				}
			});
			isSubscribed = true;

		})
		.catch(function (err) {
			console.log('Failed to subscribe the user: ', err);
		});
}
/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 *-- UNsubscribe Users
 *>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
// function unsubscribeUser() {
// 	swRegistration.pushManager.getSubscription()
// 		.then(function (subscription) {
// 			if (subscription) {
// 				return subscription.unsubscribe();
// 			}
// 		})
// 		.catch(function (error) {
// 			console.log('Error unsubscribing', error);
// 		})
// 		.then(function () {
// 			updateSubscriptionOnServer(null);
// 			console.log('User is unsubscribed.');
// 			isSubscribed = false;
// 		});
// }

/*>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
 *-- function to send your subscription data to a backend
 *>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/
function updateSubscriptionOnServer(subscription) {
	// TODO: Send subscription to application server
	const subscriptionJson = document.querySelector('.js-subscription-json');
	const subscriptionDetails = document.querySelector('.js-subscription-details');

}
