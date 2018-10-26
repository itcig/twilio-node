const express = require('express');
const router = express.Router();

const debug = require('debug');
// debug.enable('twilio:agents');
// debug.enable('twilio:error');
const log = debug('twilio:agents');
const errLog = debug('twilio:error');

const Twilio = require('twilio');
const client = new Twilio(process.env.REACT_APP_TWILIO_ACCOUNT_SID, process.env.REACT_APP_TWILIO_AUTH_TOKEN);
const AccessToken = Twilio.jwt.AccessToken;
// TODO: this shouldn't need to be accessed in React anymore so the preface can be removed from .env and updated here.
const workspaces = client.taskrouter.workspaces(process.env.REACT_APP_TWILIO_WORKSPACE_SID);

/* TTL for all tokens */
const lifetime = 3600; // TODO: should the ttl be increased?
const createWorkerTaskrouterCapabilityToken = require('../helpers/token').createWorkerTaskrouterCapabilityToken;

/**
 * Create the token required for workers to make calls
 * https://www.twilio.com/docs/iam/access-tokens
 * https://www.twilio.com/docs/voice/client/capability-tokens
 * TODO: The app SID could be moved to .env or another config area or like the angular app it could be created and retrieved within the app and stored locally in a JSON file
 * @param {string} applicationSid Twilio Voice TwiML App SID (https://www.twilio.com/console/voice/twiml/apps)
 * @param {object} worker Twilio Worker Object
 */
const createWorkerTokens = (applicationSid, worker) => {
	const workerCapability = createWorkerTaskrouterCapabilityToken(worker.sid); // create a token for Twilio TaskRouter
	const ClientCapability = Twilio.jwt.ClientCapability; // create a token for Twilio Client
	const clientName = worker.friendlyName.toLowerCase();

	const phoneCapability = new ClientCapability({
		accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
		authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN,
		ttl: lifetime
	});

	phoneCapability.addScope(new ClientCapability.IncomingClientScope(clientName));
	// TODO: test removing the keys of the object argument
	phoneCapability.addScope(new ClientCapability.OutgoingClientScope({
			applicationSid: applicationSid,
			clientName: clientName,
		}));

	const accessToken = new AccessToken(
		process.env.REACT_APP_TWILIO_ACCOUNT_SID,
		process.env.REACT_APP_TWILIO_API_KEY_SID,
		process.env.REACT_APP_TWILIO_API_KEY_SECRET,
		{ttl: lifetime},
	);
	accessToken.identity = worker.friendlyName;

	return {worker: workerCapability.toJwt(), phone: phoneCapability.toJwt()};
}

/**		~~	/agents/login	~~
 * Retrieve Worker data using the worker friendlyName, create tokens and set session data
 * @param {object} req.body.worker Twilio Worker Object
 * @param {string} req.body.endpoint Unique ID for client
 */
router.post('/login', async (req, res) => {
	log('POST /agent/login');
	try {
		const friendlyName = req.body.worker.friendlyName;
		const filter = {friendlyName};
		const workers = await workspaces.workers.list(filter);

		for (let worker of workers) {
			if (worker.friendlyName === friendlyName) {
				const tokens = await createWorkerTokens(process.env.TWILIO_APP_SID, worker);

				req.session.tokens = tokens;
				req.session.worker = {
					sid: worker.sid,
					friendlyName: worker.friendlyName,
					attributes: worker.attributes
				};

				res.status(200).end();
				return; // TODO: is this needed?
			}
		}

		res.status(404).end();
	} catch (error) {
		errLog(error);
		res.status(500).send(res.convertErrorToJSON(error));
	}
});

/**		~~	/agents/logout	~~
 * Destroy current user session
 */
router.post('/logout', async (req, res) => {
	log('POST /agent/logout');
	try {
		req.session.destroy(error => {
			if (error) {
				res.status(500).send(res.convertErrorToJSON(error)); // TODO: would this ever happen or would it fall into the catch block?
			} else {
				res.status(200).end();
			}
		});
	} catch (error) {
		errLog(error);
		res.status(500).send(res.convertErrorToJSON(error));
	}
});

/**		~~	/agents/session	~~
 * Get twilio tokens and twilio configuration
 * @param {object} req.session Set in express from the main server script (index.js)
 * @param {object} req.config Set in express from the main server script (index.js)
 */
router.get('/session', (req, res) => {
	log('GET /agent/session');
	if (!req.session.worker) {
		res.status(403).end()
	} else {
		res.status(200).json({
			tokens: req.session.tokens,
			worker: req.session.worker,
			/* This was previously the contents of configuration.JSON (Twilio SIDs, callerID, Queues, and IVR options)  */
			configuration: {twilio: req.config.twilio},
		});
	}
});

module.exports = router;