const { Given, When, Then } = require('cucumber');
const assert = require('assert').strict;

Given('I am logged in as {string}', function (name) {
	return this.authenticate(name);
});

Given('I have loaded Sludge', function () {
	return this.navigate('https://localhost:8443/', true);
});

When('I open the {string} tab', function (tab) {
	return this.driver.findElement({ xpath:`//li[@role='tab'][text()='${tab}']`}).click();
});

Then('I should see more than {int} bucket(s)', async function (count) {
	const rows = await this.driver.findElements({ className: 'ReactVirtualized__Table__row' });
	assert(rows.length > count, `Expected more than ${count} buckets, found ${rows.length}`);
});
