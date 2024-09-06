const { Given, When, Then } = require('@cucumber/cucumber');
require('chromedriver');
const { By, Key } = require('selenium-webdriver');
const assert = require('assert').strict;
import path from 'path';

const matchClass = cls => `[contains(concat(' ',normalize-space(@class),' '),' ${cls} ')]`;

Given('I am logged in as {word}', function (name) {
	return this.authenticate(name);
});

Given('I have loaded Sludge', function () {
	return this.sludge();
});

Given(/I (?:select|have selected) barrel "([^"]+)"/, async function (barrel) {
	const barrelOption = await this.waitElement({ xpath:`//div${matchClass('BarrelOption')}[text()='${barrel}']`})
	barrelOption.click();
	return this.waitElement({ xpath:`//li[@role='tab']`});
});

Given(/I (?:open|have opened) the (\w+) tab/, function (tab) {
	return this.driver.findElement({ xpath:`//li[@role='tab'][text()='${tab}']`}).click();
});

Given(/I (?:click|have clicked) the(?: (\w+))? ([A-Za-z0-9_-]+) glyph/, async function(index, glyph) {
	const glyphs = await this.driver.findElements({ css:`i.fa-${glyph}`});
	index = {null: 0, first: 0, second: 1, third: 2, fourth: 3, fifth: 4, last: glyphs.length - 1}[index];
	return glyphs[index].click();
});

When(/I enter "([^"]*)" in the (\w+) field( and press enter)?/, async function (value, field, enter) {
	const input = this.driver.findElement({ name: field });
	input.clear();
	return enter ? input.sendKeys(value, Key.ENTER) : input.sendKeys(value);
});

When('I click the {string} button', async function (text) {
	return this.driver.findElement({ xpath:`//*${matchClass('button')}[text()='${text}']`}).click();
});

When('I upload {word} {string}', async function (type, filename) {
	const field = await this.driver.findElement({ name: `${type}Upload` });
	field.sendKeys(path.resolve(__dirname,'../uploads',filename));
});

When(/I wait (\d+)ms/, function (duration) {
	return this.driver.sleep(duration);
});

Then(/I should see (\d+) ((?:row|transaction|rule|bucket)[s]?)$/, async function (count, noun) {
	return this.waitElements({ xpath: `//div[@role='row']${matchClass('ReactVirtualized__Table__row')}` }, count);
});

Then(/I should see (a|(?:\d+)) (?:bucket|rule|transaction)s? (called|searching|dated) "([^"]*)"$/, async function (count, verb, content) {
	count = count === 'a' ? 1 : parseInt(count);
	const column = { called: 1, dated: 1, searching: 2 }[verb];
	return this.waitElements({ xpath: `//div[@role='row']/div[${column}][text()='${content}']` }, count);
});

Then(/a modal should (open|close)/, async function(state) {
	const locator = { css:'div.ReactModal__Content'};
	const open = state === 'open';

	return this.waitElements(locator, open ? 1 : 0);
});

Then('the {word} field should contain {string}', async function (name, expected) {
	const field = await this.driver.findElement({ name });
	const value = await field.getAttribute('value');
	assert(value == expected, `Expected ${name} would be '${expected}', actually '${value}'`);
});
