const Twilio = require('twilio');
const TaskRouterCapability = Twilio.jwt.taskrouter.TaskRouterCapability;
//const client = new Twilio(process.env.REACT_APP_TWILIO_ACCOUNT_SID, process.env.REACT_APP_TWILIO_AUTH_TOKEN);

const lifetime = 3600;

/**
 * Create Workspace Policy
 * https://www.twilio.com/docs/taskrouter/js-sdk/workspace
 * TODO: add explanation for options
 * @param {*} options
 */
const buildWorkspacePolicy = options => {
	options = options || {}
	const resources = options.resources || [];
	const urlComponents = ['https://taskrouter.twilio.com', 'v1', 'Workspaces', process.env.REACT_APP_TWILIO_WORKSPACE_SID];

	return new TaskRouterCapability.Policy({
		url: urlComponents.concat(resources).join('/'),
		method: options.method || 'GET',
		allow: true
	});
};

/**
 * Create a Worker token good for 1 hour
 * https://www.twilio.com/docs/taskrouter/js-sdk/worker
 * @param {string} workerSid Twil Worker SID for the current worker
 */
module.exports.createWorkerTaskrouterCapabilityToken = workerSid => {
	const workerCapability = new TaskRouterCapability({
		accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
		authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN,
		workspaceSid: process.env.REACT_APP_TWILIO_WORKSPACE_SID,
		channelId: workerSid,
		ttl: lifetime,
	});
	const eventBridgePolicies = Twilio.jwt.taskrouter.util.defaultEventBridgePolicies(process.env.REACT_APP_TWILIO_ACCOUNT_SID, workerSid);
	const workspacePolicies = [
		buildWorkspacePolicy(), // Workspace fetch Policy
		buildWorkspacePolicy({resources: ['**']}), // Workspace sub-resources fetch Policy
		buildWorkspacePolicy({resources: ['**'], method: 'POST'}), // Workspace resources update Policy
	];

	eventBridgePolicies.concat(workspacePolicies).forEach(policy => workerCapability.addPolicy(policy));
	return workerCapability;
};