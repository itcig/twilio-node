const debug = require('debug');
const log = debug('twilio');
const errLog = debug('twilio:error');

const Twilio = require('twilio');
const client = new Twilio(process.env.REACT_APP_TWILIO_ACCOUNT_SID, process.env.REACT_APP_TWILIO_AUTH_TOKEN);


module.exports.updateApplicationSid = async (sid, url) => {
	if (sid) {
		try {
			// get current app JSON
			//const currentApp =  await client.applications(sid).fetch();
			//log(currentApp);
		} catch (error) {
			errLog(error);
		}
	}
}