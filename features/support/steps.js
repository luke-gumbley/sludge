const { Given, When, Then } = require('cucumber');
const assert = require('assert').strict;

Given('I am logged in as {word}', function (name) {
	return this.authenticate(name);
});

Given('I have loaded Sludge', function () {
	return this.navigate('https://localhost:8443/', true);
});

Given(/I (?:open|have opened) the (\w+) tab/, function (tab) {
	return this.driver.findElement({ xpath:`//li[@role='tab'][text()='${tab}']`}).click();
});

Given(/I (?:click|have clicked) the (\w+) glyph/, function(glyph) {
	return this.driver.findElement({ css:`i.fa-${glyph}`}).click();
});

Then('I should see more than {int} bucket(s)', async function (count) {
	const rows = await this.driver.findElements({ className: 'ReactVirtualized__Table__row' });
	assert(rows.length > count, `Expected more than ${count} buckets, found ${rows.length}`);
});

Then('a blank modal should open', async function() {
	const modals = await this.driver.findElements({ css:'div.ReactModal__Content'});
	assert(modals.length === 1, `Expected one modal, found ${modals.length}`);
});
