const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const HttpsProxyAgent = require('https-proxy-agent');

const buckets = require('./buckets/buckets.js');
const transactions = require('./transactions/transactions.js');
const rules = require('./rules/rules.js');
const utils = require('./utils.js');

const database = require('./database');
const secrets = require('./secrets');

const app = express();

passport.serializeUser((user, done) => done(null, user) );
passport.deserializeUser((user, done) => done(null, user) );

const strategy = new GoogleStrategy({
		clientID: secrets.googleAPIClientId,
		clientSecret: secrets.googleAPIClientSecret,
		callbackURL: process.env.HOSTNAME + '/auth/google'
	},
	(token, refresh, profile, done) => done(null, { profile, token })
);

if (process.env['https_proxy']) {
	const httpsProxyAgent = new HttpsProxyAgent(process.env['https_proxy']);
	strategy._oauth2.setAgent(httpsProxyAgent);
}

passport.use(strategy);

app.use(function(req, res, next) {
	const start = Date.now();
	res.on('finish', function() {
		utils.log({
			time: new Date(start),
			user: (req.decoded || {}).email,
			duration: Date.now() - start,
			content: req.originalUrl
		});
	});
	next();
});

app.use(passport.initialize());
app.use(bodyParser.json({ type: ['application/json', 'application/json-patch+json'] }));
app.use(cookieParser());

function createTokens(email, barrelId) {
	const xsrfToken = crypto.randomBytes(33).toString('base64');
	const payload = { email, barrelId, xsrfToken };
	const token = jwt.sign(payload, secrets.jwtSecret, { expiresIn: '24h' });

	return { xsrfToken, token };
}

app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'], session: false }), (req, res, next) => {
	const email = req.user.profile.emails.filter(e => e.type === 'account')[0].value

	database.user.findOne({ where: { email }})
		.then(user => {
			if(!user) {
				return res.status(401)
					.set({ 'WWW-Authenticate': 'Bearer realm="Sludge tool"' })
					.sendFile(require.resolve('../app/401.html'));
			}

			const { xsrfToken, token } = createTokens(email, user.barrelId);

			res.cookie('xsrf-token', xsrfToken, {
				secure: process.env.COOKIE_SECURE === 'true',
				maxAge: 24 * 60 * 60 * 1000,
				expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
			})

			res.cookie('access-token',token, {
				httpOnly: true,
				secure: process.env.COOKIE_SECURE === 'true',
				maxAge: 24 * 60 * 60 * 1000,
				expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
			});

			res.redirect('/');
		});
});

function verifyToken(token) {
	return new Promise(resolve => {
		jwt.verify(token, secrets.jwtSecret, (err, decoded) => {
			resolve({ err, decoded });
		});
	})
}

const authenticator = failure => {
	return express.Router().use((req, res, next) => {
		const token = (req.headers['authorization'] || '').substring('Bearer '.length) || req.cookies['access-token'];

		verifyToken(token).then(({ err, decoded }) => {
			req.decoded = decoded;
			return err
				? failure(res)
				: next();
		});
	});
}

const xsrfCheck = failure => {
	return express.Router().use((req, res, next) => {
		return !req.decoded.xsrfToken || req.headers['x-xsrf-token'] !== req.decoded.xsrfToken
			? failure(res)
			: next();
	})
}

const authFail = res => res.status(403).send({ success: false, message: 'Token not provided or invalid.' });
app.use('/api', authenticator(authFail), xsrfCheck(authFail));

app.use('/api/transactions', transactions);
app.use('/api/buckets', buckets);
app.use('/api/rules', rules);

app.use('/blank', (req, res, next) => res.sendStatus(200));
app.use(authenticator(res => res.redirect('/auth/google')));
app.use(express.static('dist/'));

let server;

function start(secure, port) {
	server = secure
		? https.createServer({
				key: fs.readFileSync('./certs/server.key'),
				cert: fs.readFileSync('./certs/server.crt')
			}, app)
		: http.createServer(app);

	return new Promise(resolve => {
		server.listen(port, function() {
			resolve(server);
		});
	});
}

function stop() {
	return new Promise(resolve => {
		server.close(() => {
			resolve();
		});
	});
}

module.exports = { createTokens, verifyToken, app, start, stop };
