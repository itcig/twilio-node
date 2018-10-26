const express = require('express');
const router = express.Router();

const debug = require('debug');
// debug.enable('twilio:phone');
// debug.enable('twilio:error');
const log = debug('twilio:phone');
const errLog = debug('twilio:error');

const Twilio = require('twilio');
const client = new Twilio(process.env.REACT_APP_TWILIO_ACCOUNT_SID, process.env.REACT_APP_TWILIO_AUTH_TOKEN);
const conferenceHelper = require('../helpers/conference-helper');


/**		~~  /phone/call  ~~
 * Make a new conference, once it's successfully created run callback
 * !This is the api that Twilio will use and isn't directly used by OUR frontend
 * @param {string} req.body.callSid Twilio Call SID for current Worker
 * @param {string} req.body.phone Phone number of participant to be added to the call (customer)
 * @param {object} req.config Set in express from the main server script (index.js)
 */
router.post('/call', (req, res) => {
	log('POST /phone/call');
	const name = `conf_${req.body.callSid}`;
	const twiml = new Twilio.twiml.VoiceResponse();
	const dial = twiml.dial({callerId: req.config.twilio.callerId});

	/* When a participant joins the call, run hit the add-participant route */
	dial.conference({
			endConferenceOnExit: true,
			statusCallbackEvent: 'join',
			statusCallback: `https://${req.hostname}/phone/call/${req.body.callSid}/add-participant/${encodeURIComponent(req.body.phone)}`
		}, name);

	// send xml
	res.set({'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=0'});
	res.send(twiml.toString());
});

/**		~~  /phone/call/:sid/conference  ~~
 * Get a conference SID and call SID participant
 * @param {string} req.params.sid Twilio conference SID
 * @param {string} req.body.callSid Twilio call SID for current worker call
 */
router.get('/call/:sid/conference', async (req, res) => {
	log('GET /phone/call/:sid/conference')
	try {
		const conference = await conferenceHelper.getConferenceByName('conf_' + req.params.sid);
		const participants = await conferenceHelper.getConferenceParticipants(conference.sid);

		const payload = {conferenceSid: conference.sid};
		const list = participants.filter(callSid => (callSid !== req.body.callSid) ? callSid : null);

		if (list.length !== 0) {
			payload.callSid = list[0];
		}

		res.json(payload);

	} catch (error) {
		errLog(error);
		res.status(500).end();
	}
});

/**		~~  /phone/call/:sid/add-participant/:phone  ~~
 * Add a participant to an existing conference
 * @param {string} req.params.sid Twilio conference SID
 * @param {string} req.body.callSid Twilio call SID for current worker call
 * @param {string} req.params.phone Phone number of the participant being added
 */
router.post('/call/:sid/add-participant/:phone', async (req, res) => {
	log('POST /phone/call/:sid/add-participant/:phone');

	// Make sure the current call is a conference call
	if (req.body.CallSid === req.params.sid) {
		try {
			const addParticipant = {
				to: req.params.phone,
				from: req.configuration.twilio.callerId,
				earlyMedia: true,
				endConferenceOnExit: true,
			};

			/* The agent joined, now call the participant phone number and add it to the conference */
			await client.conferences('conf_' + req.params.sid).participants.create(addParticipant)
			res.status(200).end();

		} catch (error) {
			errLog(error);
			res.status(500).end();
		}

	} else {
		res.status(200).end();
	}
});

/**		~~  /phone/call/:sid/hold  ~~
 * Update a conference participant's hold status
 * @param {string} req.params.sid Twilio conference SID
 * @param {string} req.body.callSid Twilio call SID of the participant (not the current worker)
 * @param {boolean} req.body.hold If the participant should be on hold
 */
router.post('/call/:sid/hold', async (req, res) => {
	log('POST /phone/hold');
	try {
		await client.conferences(req.params.sid).participants(req.body.callSid).update({hold: req.body.hold})
		res.status(200).end();
	} catch (error) {
		errLog(error);
		res.status(500).end();
	}
});

module.exports = router;