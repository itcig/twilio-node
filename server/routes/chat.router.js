const express = require('express');
const router = express.Router();

const debug = require('debug');
const log = debug('twilio');
const errLog = debug('twilio:error');

const Twilio = require('twilio');
const client = new Twilio(process.env.FLEX_ACCOUNT_SID, process.env.FLEX_AUTH_TOKEN);

router.post('/channel/add', async (req, res) => {
	log('POST /chat/channel/add');
	const servSid = process.env.FLEX_CHAT_SERVICE_SID;
	const chanSid = process.env.FLEX_CHAT_CHANNEL_SID;

	const memb = {
		identity: req.body.identity,
		roleSid: req.body.roleSid,
	};

	try {
		const member = await client.chat.services(servSid).channels(chanSid).members.create(memb);
		res.status(200).send(member);

	} catch (error) {
		errLog(error);
		res.status(500).end();
	}
});

router.post('/channel/update', async (req, res) => {
	log('POST /chat/channel/update');
	const servSid = process.env.FLEX_CHAT_SERVICE_SID;
	const chanSid = process.env.FLEX_CHAT_CHANNEL_SID;

	const memb = {
		identity: req.body.identity,
		roleSid: req.body.roleSid,
	};

	try {
		const member = await client.chat.services(servSid).channels(chanSid).members.update(memb);
		res.status(200).send(member);

	} catch (error) {
		errLog(error);
		res.status(500).end();
	}
});

module.exports = router;