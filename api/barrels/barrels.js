import express from 'express';
import path from 'path';

import database from '../database.js';

const app = express();
export default app;

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
					.sendFile(path.resolve(import.meta.dirname, '../../app/401.html'));
			}
			res.json(user.barrels.map(barrel => ({ id: barrel.id, name: barrel.name })));
		});
});
