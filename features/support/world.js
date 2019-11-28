const { setWorldConstructor, BeforeAll, Before, After, AfterAll } = require('cucumber');
const { Builder, until, Condition } = require('selenium-webdriver');
const { checkedLocator } = require('selenium-webdriver/lib/by');

const database = require('../../api/database');
const api = require('../../api');
let driver, baseUrl;

BeforeAll(async function() {
	driver = new Builder().forBrowser('chrome').build();
	await database.connectTemp();
	await database.testData();
	const server = await api.start(true, 0);
	baseUrl = `https://localhost:${server.address().port}`;
});

let failures = false;

Before(function({pickle}) {
	process.stdout.write('\n' + pickle.name);
	return failures ? 'skipped' : undefined;
})

After(function({result}) {
	failures |= result.status === 'failed';
});

AfterAll(async function() {
	if(!failures) {
		driver.close();
		await api.stop();
		await database.close();
	}
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

		await options.addCookie({
			name: 'xsrf-token',
			value: xsrfToken,
			expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
			secure: true
		});

		await options.addCookie({
			name: 'access-token',
			value: token,
			httpOnly: true,
			secure: true,
			expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
		});

		return this.navigate(baseUrl + '/blank');
	}

	async waitElement(locator) {
		return this.driver.wait(until.elementLocated(checkedLocator(locator)), 1000);
	}

	async waitElements(locator, count) {
		locator = checkedLocator(locator);
		const locatorStr = typeof locator === 'function' ? 'by function()' : locator + '';
		const condition = new Condition(
			`for ${count} element${count!=1?'s':''} to be located ${locatorStr}`,
			async function(driver) {
				const elements = await driver.findElements(locator);
				return elements.length === count ? elements : null;
			}
		);
		return this.driver.wait(condition, 1000);
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
