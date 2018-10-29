const debug = require('debug');
const nLog = debug('ngrok');
const log = debug('twilio');
const errLog = debug('twilio:error');
const nodemon = require('nodemon');
const ngrok = require('ngrok');

const port = process.env.PORT || 6666;

// TODO: Think of how Twilio development can happen without messing up a production version
// - What is needed in Twilio and what would need to be updated for use with a dev environment

/**
 * This creates an ngrok tunnel and then starts nodemon, which prevents the ngrok url from changing every time nodemon restarts the server
 * If there is a Twilio App SID specified then this will update the TwiML App url with the new ngrok url
 */
(async function() {
	if (process.env.NODE_ENV === 'development') {
		try {
			// Setup Ngrok Tunnel
			const url = await ngrok.connect(port);
			nLog(`ngrok url -> ${url}`);

			let updateUrl= true; // only update when the ngrok url changes
			if (process.env.TWILIO_APP_SID && updateUrl) {
				log(`Updating TwiML App Callback URL...`)
				const callbackUrl = `${url}/phone/call`;
				require('../server/helpers/setup-helper').updateTwimlApplicationCallbackUrl(process.env.TWILIO_APP_SID, callbackUrl);
				updateUrl = false;
			}

			// Tell Nodemon to start server and set ngrok url env variable
			nodemon(`-x 'NGROK_URL=${url} node' ./server/index.js`);

			nodemon.on('start', () => log('App has started'))
				.on('quit', () => log('App has quit'))
				.on('restart', files => log('App restarted due to: ', files));
		} catch (error) {
			errLog(`Start Script error -> ${error}`);
		}
	}
})();
