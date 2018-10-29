const debug = require('debug');
const log = debug('twilio');
const errLog = debug('twilio:error');

const Twilio = require('twilio');
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Update the voice callback URL for a Twilio TwiML app
 * @param {string} sid TwiML Coide Application SID
 * @param {string} url Voice Callback URL (AKA REQUEST URL)
 */
module.exports.updateTwimlApplicationCallbackUrl = async (sid, url) => {
	if (sid) {
		try {
			const currentApp =  await client.applications(sid).fetch(); // get current app config
			if (currentApp.voiceUrl !== url) {
				log(`Current TwiML App callback URL -> ${currentApp.voiceUrl}`);
				log(`New TwiML App callback URL -> ${url}`);
				client.applications(sid).update({voiceUrl: url});
			}
		} catch (error) {
			errLog(error);
		}
	}
}