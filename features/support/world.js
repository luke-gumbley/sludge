const { setWorldConstructor, BeforeAll, AfterAll } = require('cucumber');
const webdriver = require('selenium-webdriver');

const database = require('../../api/database');
const api = require('../../api');
let driver, baseUrl;

BeforeAll(async function() {
	driver = new webdriver.Builder().forBrowser('chrome').build();
	await database.connectTest();
	const server = await api.start(true, 0);
	baseUrl = `https://localhost:${server.address().port}`;
});

AfterAll(async function() {
	driver.close();
	await api.stop();
	await database.close();
});

class CustomWorld {
	constructor() {
		this.driver = driver;
	}

	async authenticate(name) {
		const url = await this.driver.getCurrentUrl();
		if(!url.startsWith(baseUrl))
			this.navigate(baseUrl + '/blank');

		const options = this.driver.manage();

		const accessCookie = await options.getCookie('access-token');
		if(accessCookie) {
			const { err, decoded } = await api.verifyToken(accessCookie.value);
			if(!err && decoded && decoded.email && decoded.email.startsWith(name.toLowerCase()))
				return;
		}

		const barrels = {
			Alex: 1,
			Sam: 1,
			Morgan: 2,
			Charlie: 3
		};

		const { xsrfToken, token } = api.createTokens(name.toLowerCase() + '@email.com', barrels[name]);

		options.addCookie({
			name: 'xsrf-token',
			value: xsrfToken,
			expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
			secure: true
		});

		options.addCookie({
			name: 'access-token',
			value: token,
			httpOnly: true,
			secure: true,
			expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
		});

		return this.navigate(baseUrl + '/blank');
	}

	async navigate(url, conditional) {
		if(conditional) {
			const currentUrl = await this.driver.getCurrentUrl();
			if(currentUrl === url) return;
		}
		return this.driver.navigate().to(url);
	}

	async sludge() {
		return this.navigate(baseUrl, true);
	}
}

setWorldConstructor(CustomWorld);
