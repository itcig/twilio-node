const Twilio = require('twilio');
const client = new Twilio(process.env.REACT_APP_TWILIO_ACCOUNT_SID, process.env.REACT_APP_TWILIO_AUTH_TOKEN);

/**
 * Get a conference by it's name
 * @param {string} name of the conference ie "conf_[call SID]"
 */
module.exports.getConferenceByName = name => {
	const options = {
		status: 'in-progress',
		friendlyName: name
	}

	return new Promise((resolve, reject) => {
		client.conferences.list(options)
			.then(conferences => {
				if (conferences.length === 0) {
					reject('NOT_FOUND');
				} else {
					resolve(conferences[0]);
				}
			})
			.catch(error => {
				reject(error);
			});
	});
};

/**
 * Get a list of call SIDs that are apart of a conference
 * @param {string} conferenceSid Twilio conference SID
 */
module.exports.getConferenceParticipants = conferenceSid => {
	return new Promise((resolve, reject) => {
		client.conferences(conferenceSid).participants.list()
			.then(participants => {
				const list = [];
				participants.map(participant => list.push(participant.callSid));
				resolve(list);
			})
			.catch(error => {
				reject(error);
			});
	});
};
