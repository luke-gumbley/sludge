const { Given, When, Then } = require('cucumber');
const { By } = require('selenium-webdriver');
const assert = require('assert').strict;

const matchClass = cls => `[contains(concat(' ',normalize-space(@class),' '),' ${cls} ')]`;

Given('I am logged in as {word}', function (name) {
	return this.authenticate(name);
});

Given('I have loaded Sludge', function () {
	return this.sludge();
});

Given(/I (?:open|have opened) the (\w+) tab/, function (tab) {
	return this.driver.findElement({ xpath:`//li[@role='tab'][text()='${tab}']`}).click();
});

Given(/I (?:click|have clicked) the(?: (\w+))? ([A-Za-z0-9_-]+) glyph/, async function(index, glyph) {
	const glyphs = await this.driver.findElements({ css:`i.fa-${glyph}`});
	index = {undefined: 0, first: 0, second: 1, third: 2, fourth: 3, fifth: 4, last: glyphs.length - 1}[index];
	return glyphs[index].click();
});

When('I enter {string} in the {word} field', async function (value, field) {
	const input = this.driver.findElement({ name: field });
	input.clear();
	return input.sendKeys(value);
});

When('I click the {string} button', async function (text) {
	return this.driver.findElement({ xpath:`//*${matchClass('button')}[text()='${text}']`}).click();
});

Then(/I should see (\d+) ((?:row|transaction|rule|bucket)[s]?)/, async function (count, noun) {
	const rows = await this.driver.findElements({ xpath: `//div[@role='row']${matchClass('ReactVirtualized__Table__row')}` });
	assert(rows.length === count, `Expected ${count} ${noun}, found ${rows.length}`);
});

Then('I should see a bucket called {string}', async function (name) {
	await this.waitElement({ xpath: `//div[@role='row']/div[1][text()='${name}']` });
});

Then(/a modal should (open|close)/, async function(state) {
	const locator = { css:'div.ReactModal__Content'};
	const open = state === 'open';

	const modals = open
		? [await this.waitElement(locator)].filter(e => e)
		: await this.driver.findElements(locator); // TODO: hinky. If it took a while to close this check would fail.

	assert(modals.length === (open ? 1 : 0), `Modal did not ${state}`);
});

Then('the {word} field should contain {string}', async function (name, expected) {
	const field = await this.driver.findElement({ name });
	const value = await field.getAttribute('value');
	assert(value == expected, `Expected ${name} would be '${expected}', actually '${value}'`);
});
