const { setWorldConstructor } = require('cucumber');
const webdriver = require('selenium-webdriver');

const { createTokens, verifyToken } = require('../../api');

class CustomWorld {
	constructor() {
		this.driver = new webdriver.Builder()
		    .forBrowser('chrome')
		    .build();
	}

	async authenticate(name) {
		const url = await this.driver.getCurrentUrl();
		if(!url.startsWith('https://localhost:8443'))
			this.navigate('https://localhost:8443/blank');

		const options = this.driver.manage();

		const accessCookie = options.getCookie('access-token');
		if(accessCookie) {
			const { err, decoded } = await verifyToken(accessCookie.value);
			if(!err && decoded && decoded.email && decoded.email.startsWith(name))
				return;
		}

		const barrels = {
			jane: 1,
			frank: 1,
			mary: 2,
			jim: 3
		};

		const { xsrfToken, token } = createTokens(name + '@email.com', barrels[name]);

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

		return this.navigate('https://localhost:8443/blank');
	}

	async navigate(url, conditional) {
		if(conditional) {
			const currentUrl = await this.driver.getCurrentUrl();
			if(currentUrl === url) return;
		}
		return this.driver.navigate().to(url);
	}
}

setWorldConstructor(CustomWorld);
