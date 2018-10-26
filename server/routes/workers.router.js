const express = require('express');
const router = express.Router();

const debug = require('debug');
// debug.enable('twilio:workers');
// debug.enable('twilio:error');
const log = debug('twilio:workers');
const errLog = debug('twilio:error');

const Twilio = require('twilio');
const client = new Twilio(process.env.REACT_APP_TWILIO_ACCOUNT_SID, process.env.REACT_APP_TWILIO_AUTH_TOKEN);
const workers = client.taskrouter.workspaces(process.env.REACT_APP_TWILIO_WORKSPACE_SID).workers;

/**		~~  /workers/available  ~~
 * Get a list of available workers (SID and friendlyName) excludes current worker
 * !requires authentication
 */
router.get('/available', async (req, res) => {
	log('GET /workers/available');
	try {
		const payload = [];
		const workersList = await workers.list();

		for (let worker of workersList) {
			//let attributes = JSON.parse(worker.attributes); // maybe we'll use these in conditional?
			if (req.session.worker.sid !== worker.sid && worker.available) {
				payload.push({
					sid: worker.sid,
					friendlyName: worker.friendlyName,
				})
			}
		}
		res.status(200).json(payload);
	} catch (error) {
		errLog(error.response);
		res.status(500).send(res.convertErrorToJSON(error));
	}
});

/**		~~  /workers  ~~
 * Get a list of all workers (SID, friendlyName, attributes, and activity) excludes current worker
 * !requires authentication
 */
router.get('/', async (req, res) => {
	log('GET /workers');
	try {
		const payload = [];
		const workersList = await workers.list();

		for (let worker of workersList) {
			if (req.session.worker.sid !== worker.sid && worker.available) {
				payload.push({
					sid: worker.sid,
					friendlyName: worker.friendlyName,
					attributes: JSON.parse(worker.attributes),
					activityName: worker.activityName,
				})
			}
		}
		res.status(200).json(payload);
	} catch (error) {
		errLog(error.response);
		res.status(500).send(res.convertErrorToJSON(error));
	}
});

/**		~~  /workers  ~~
 * Get a list of all workers (SID, friendlyName, attributes, and activity)
 * TODO -- this is not working with postman
 */
router.post('/', async (req, res) => {
	log('POST /workers');
	try {
		const newWorker = {
			friendlyName: req.body.friendlyName,
			attributes: req.body.attributes
		}

		log({newWorker});

		const worker = await workers.create(newWorker);
		log(worker);
		const payload = {
			sid: worker.sid,
			friendlyName: worker.friendlyName,
			attributes: worker.attributes,
			activityName: worker.activityName,
		};

		res.status(200).json(payload);
	} catch (error) {
		errLog(error);
		res.status(500).send(res.convertErrorToJSON(error));
	}
});

/**		~~  /workers  ~~
 * Remove a worker from Twilio
 * TODO -- this is untested
 */
router.delete('/', async (req, res) => {
	log('DELETE /workers');
	try {
		const workerId = req.params.id;
		await workers(workerId).remove();
		res.status(200).end();
	} catch (error) {
		errLog(error);
		res.status(500).send(res.convertErrorToJSON(error));
	}
});


module.exports = router;