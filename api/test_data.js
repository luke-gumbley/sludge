const moment = require('moment');

const today = moment().startOf('day');
const month = moment().startOf('month');
const week = moment().startOf('week');
const lastWeek = moment().startOf('week').add(-7, 'days');
const offset = days => moment(lastWeek).add(days, 'days');

module.exports = {
	barrel: [{}, {}, {}, {}],
	user: [
		{ name: 'Alex', email: 'alex@email.com'},
		{ name: 'Sam', email: 'sam@email.com'},
		{ name: 'Luke', email: 'luke.gumbley@gmail.com'},
		{ name: 'Morgan', email: 'morgan@email.com'},
		{ name: 'Charlie', email: 'charlie@email.com'},
	],
	bucket: [
		{ barrelId: 1, name: 'mortgage', amount: 1234.56, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 1, name: 'food', amount: 375, period: 7, periodUnit: 'days', date: week, budget: 'Slush' },
		{ barrelId: 1, name: 'internet', amount: 85, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 1, name: 'petrol', amount: 75, period: 7, periodUnit: 'days', date: week, budget: 'Slush' },
		{ barrelId: 1, name: 'train', amount: 270, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 2, name: 'house', amount: 1234.56, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 2, name: 'eats', amount: 375, period: 7, periodUnit: 'days', date: week, budget: 'Slush' },
		{ barrelId: 2, name: 'bits', amount: 85, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 2, name: 'fuel', amount: 75, period: 7, periodUnit: 'days', date: week, budget: 'Slush' },
		{ barrelId: 2, name: 'choo choo', amount: 270, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
	],
	transaction: [
		{ barrelId: 1, date: offset(0), ordinal: 0, account: 'Cheque', party: 'BigBank co.', particulars: 'Mortgage', code: 'SMITH-JONES', reference: '', amount: 1234.56, type: 'TL', bucketId: 1 },
		{ barrelId: 1, date: offset(0), ordinal: 1, account: 'Credit', party: 'Supermarket inc.', particulars: 'Foxton', code: 'NZD23119', reference: '', amount: 231.19, type: 'PUR', bucketId: 2 },
		{ barrelId: 1, date: offset(1), ordinal: 0, account: 'Credit', party: 'Sensible Organics', particulars: 'Wellington', code: 'NZD2956', reference: '', amount: 29.56, type: 'PUR', bucketId: 2 },
		{ barrelId: 1, date: offset(1), ordinal: 1, account: 'Cheque', party: 'Buy n Eat Wellington', particulars: 'Porirua', code: '', reference: '', amount: 103.28, type: 'POS' },
		{ barrelId: 1, date: offset(2), ordinal: 0, account: 'Credit', party: 'Pipes ltd.', particulars: 'Christchurch', code: '', reference: '', amount: 85, type: 'PUR' },
		{ barrelId: 1, date: offset(2), ordinal: 1, account: 'Credit', party: 'Less Johnsons', particulars: '349876234', code: 'Wellington', reference: '0499191354', amount: 94.27, type: 'PUR', bucketId: 2 },
		{ barrelId: 1, date: offset(2), ordinal: 2, account: 'Cheque', party: 'Octane Pump', particulars: 'Foxton', code: 'NZD71.21', reference: '', amount: 71.21, type: 'POS' },
		{ barrelId: 1, date: offset(3), ordinal: 0, account: 'Credit', party: 'Immobil', particulars: 'Levin', code: 'NZD43.29', reference: '', amount: 43.29, type: 'PUR' },
		{ barrelId: 2, date: offset(0), ordinal: 0, account: 'Cheque', party: 'EastCram Bank', particulars: 'Mortgage', code: 'SMITH-JONES', reference: '', amount: 1234.56, type: 'TL', bucketId: 1 },
		{ barrelId: 2, date: offset(0), ordinal: 1, account: 'Credit', party: 'OnThree Groceries', particulars: 'Foxton', code: 'NZD23119', reference: '', amount: 231.19, type: 'PUR', bucketId: 2 },
		{ barrelId: 2, date: offset(1), ordinal: 0, account: 'Credit', party: 'Frangible Herbolics', particulars: 'Wellington', code: 'NZD2956', reference: '', amount: 29.56, type: 'PUR', bucketId: 2 },
		{ barrelId: 2, date: offset(1), ordinal: 1, account: 'Cheque', party: 'Pick n Pay Wellington', particulars: 'Porirua', code: '', reference: '', amount: 103.28, type: 'POS' },
		{ barrelId: 2, date: offset(2), ordinal: 0, account: 'Credit', party: 'Baco-net ltd.', particulars: 'Christchurch', code: '', reference: '', amount: 85, type: 'PUR' },
		{ barrelId: 2, date: offset(2), ordinal: 1, account: 'Credit', party: 'Hitch Thompsons', particulars: '349876234', code: 'Wellington', reference: '0499191354', amount: 94.27, type: 'PUR', bucketId: 2 },
		{ barrelId: 2, date: offset(2), ordinal: 2, account: 'Cheque', party: 'Alkane Tank', particulars: 'Foxton', code: 'NZD71.21', reference: '', amount: 71.21, type: 'POS' },
		{ barrelId: 2, date: offset(3), ordinal: 0, account: 'Credit', party: 'Texcal', particulars: 'Levin', code: 'NZD43.29', reference: '', amount: 43.29, type: 'PUR' },
	],
	rule: [
		{ barrelId: 1, account: '', search: 'Pipes Christchurch', bucketId: 3 },
		{ barrelId: 1, account: '', search: 'BigBank', bucketId: 1 },
		{ barrelId: 1, account: '', search: 'Octane', bucketId: 4 },
		{ barrelId: 2, account: '', search: 'Baco Christchurch', bucketId: 3 },
		{ barrelId: 2, account: '', search: 'EastCram', bucketId: 1 },
		{ barrelId: 2, account: '', search: 'Alkane', bucketId: 4 },
	],

	setup: async function(models) {
		await models.barrel[0].addUsers([1,2,3]);
		await models.barrel[1].addUsers([1,3]);
		await models.barrel[2].addUser([4]);
		await models.barrel[3].addUser([5]);
	},
};
