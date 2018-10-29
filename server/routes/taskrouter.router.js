const express = require('express');
const router = express.Router();

const debug = require('debug');
// debug.enable('twilio:taskrouter');
// debug.enable('twilio:error');
const log = debug('twilio:taskrouter');
const errLog = debug('twilio:error');


const Twilio = require('twilio');
const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//@TODO this shouldn't need to be accessed in React anymore so the preface can be removed from .env and updated here.
const workspaces = client.taskrouter.workspaces(process.env.TWILIO_WORKSPACE_SID);

/**		~~  /taskrouter/activities  ~~
 * Get a list of activities for the workspace
 */
router.get('/activities', async (req, res) => {
	log('GET /taskrouter/activities');
	try {
		const activities = await workspaces.activities.list();
		const payload = [];
		for (let item of activities) {
			const activity = {
				sid: item.sid,
				friendlyName: item.friendlyName,
			}
			payload.push(activity)
		}
		res.status(200).send(payload);
	} catch (error) {
		errLog(error);
		res.status(500).send(error);
	}
});

module.exports = router;