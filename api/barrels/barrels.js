const express = require('express');
const Sequelize = require('sequelize');

const database = require('../database.js');

const app = module.exports = express();

app.get('/', function (req, res) {
	database.user.findOne({
		where: { email: req.decoded.email },
		include: [{ model: database.barrel, required: false }]
	})
		.then(user => {
			if(!user) {
				// user no longer exists in the DB, clear cookies and redirect
				res.clearCookie('token');
				res.clearCookie('xsrf-token');
				return res.status(403)
					.set({ 'WWW-Authenticate': 'Bearer realm="Sludge tool"' })
					.sendFile(require.resolve('../../app/401.html'));
			}
			res.json(user.barrels.map(barrel => barrel.id));
		});
});
