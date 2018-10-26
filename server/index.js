// Followed this guide -- https://www.twilio.com/blog/react-app-with-node-js-server-proxy
// https://github.com/philnash/react-express-starter/tree/twilio

const express = require('express');
const sessions = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config(); // The app is reading from the .env with this commented out, perhaps because of the create react app?

/* For better Logging and Debugging */
const pino = require('express-pino-logger')();

//global.debug = require('debug');
//global.errLog = debug('twilio:error');
const debug = require('debug');
const log = debug('twilio');
const errLog = debug('twilio:error');

// const winston = require('winston');
// const expressWinston = require('express-winston');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

// // const ngrok = require('ngrok');
// const ngrokUrl = async function () {
// 	try {
// 		const url = await require('ngrok').connect(port)
// 		console.log('ngrok url ->', url)
// 	} catch (err) {
// 		console.log('ngrok error ->', err)
// 	}
// }

/**
 * For Development Only, create a secure tunnel to the local machine for Twilio
 */
const ngrokUrl = async () => {
	if (process.env.NODE_ENV === 'development') {
		try {
			const nodemon = require('nodemon');
			const url = await require('ngrok').connect(port);
			log(`ngrok url -> ${url}`);

			nodemon(`-x 'NGROK_URL=${url} node' ./index.js`);

			nodemon.on('start', () => log('App has started'))
				.on('quit', () => log('App has quit'))
				.on('restart', files => log('App restarted due to: ', files));

			// if (process.env.TWILIO_APP_SID) {
			// 	//require('./helpers/setup-helper').updateApplicationSid(process.env.TWILIO_APP_SID, url);
			// }
		} catch (error) {
			errLog(`ngrok error -> ${error}`);
		}
	}
};

/* Setup Twilio session key for client to access it's session data */
app.use(sessions({
	resave: true,
	saveUninitialized: false,
	secret: 'keyboard cat',
	name: 'twilio_call_center_session',
	cookie: {maxAge: 3600000},
}));

/* Reformat Errors */
// TODO: this is from the original repo, not sure if it's needed
app.use((req, res, next) => {
	const replaceErrors = (key, value) => {
		if (value instanceof Error) {
			const error = {};
			Object.getOwnPropertyNames(value).forEach(key => {
				error[key] = value[key];
			});
			return error;
		}
		return value;
	};

	res.convertErrorToJSON = error => {
		console.log(error);
		return JSON.stringify(error, replaceErrors);
	};
	next();
});

/* Set request properties */
app.use((req, res, next) => {
	const config = {
		twilio: {
			callerId: '+12402215042',
		},
	};

	req.config = config;
	next();
});

/* Set Request props */
app.use('/', (req, res, next) => {
	res.set({
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=0',
	});
	next();
});

/* Request Logging - must come before routes */
// app.use(expressWinston.logger({
// 		transports: [
// 			new winston.transports.Console(),
// 			// Write to all logs with level `info` and below to `./logs/combined.log`
// 			new winston.transports.File({ filename: './logs/combined.log' }),
// 		],
// 		format: winston.format.combine(
// 			winston.format.colorize(),
// 			winston.format.json()
// 		),
// 		meta: true, // optional: control whether you want to log the meta data about the request (default to true)
// 		msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
// 		expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
// 		colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
// 		ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
//     }));

/* Routes */ // TODO: instead of manually listing these use JS to read the contents of the routes directory and loop through to create the routes
const agentsRouter = require('./routes/agents.router.js');
app.use('/agents', agentsRouter);

const phoneRouter = require('./routes/phone.router.js');
app.use('/phone', phoneRouter);

const taskrouterRouter = require('./routes/taskrouter.router.js');
app.use('/taskrouter', taskrouterRouter);

const workersRouter = require('./routes/workers.router.js');
app.use('/workers', workersRouter);

/* Error Logging - must come after routes */
// app.use(expressWinston.errorLogger({
// 		transports: [
// 			new winston.transports.Console(),
// 			// Write all logs error (and below) to `./logs/error.log`.
// 			new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
// 		],
// 		format: winston.format.combine(
// 			winston.format.colorize(),
// 			winston.format.json()
//       	)
//     }));

app.listen(port, () => {
	log(`Server running on http://localhost:${port}`);
	ngrokUrl();
});