const moment = require('moment');

const today = moment().startOf('day');
const month = moment().startOf('month');
const week = moment().startOf('week');
const lastWeek = moment().startOf('week').add(-7, 'days');
const offset = days => moment(lastWeek).add(days, 'days');

module.exports = {
	barrel: [{}, {}, {}],
	user: [
		{ barrelId: 1, name: 'Alex', email: 'alex@email.com'},
		{ barrelId: 1, name: 'Sam', email: 'sam@email.com'},
		{ barrelId: 1, name: 'Luke', email: 'luke.gumbley@gmail.com'},
		{ barrelId: 2, name: 'Morgan', email: 'morgan@email.com'},
		{ barrelId: 3, name: 'Charlie', email: 'charlie@email.com'},
	],
	bucket: [
		{ barrelId: 1, name: 'mortgage', amount: 1234.56, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 1, name: 'food', amount: 375, period: 7, periodUnit: 'days', date: week, budget: 'Slush' },
		{ barrelId: 1, name: 'internet', amount: 85, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
		{ barrelId: 1, name: 'petrol', amount: 75, period: 7, periodUnit: 'days', date: week, budget: 'Slush' },
		{ barrelId: 1, name: 'train', amount: 270, period: 1, periodUnit: 'month', date: month, budget: 'Slush' },
	],
	transaction: [
		{ barrelId: 1, date: offset(0), ordinal: 0, account: 'Cheque', party: 'BigBank co.', particulars: 'Mortgage', code: 'SMITH-JONES', reference: '', amount: 1234.56, type: 'TL', bucketId: 1 },
		{ barrelId: 1, date: offset(0), ordinal: 1, account: 'Credit', party: 'Supermarket inc.', particulars: 'Foxton', code: 'NZD23119', reference: '', amount: 231.19, type: 'PUR' },
		{ barrelId: 1, date: offset(1), ordinal: 0, account: 'Credit', party: 'Sensible Organics', particulars: 'Wellington', code: 'NZD2956', reference: '', amount: 29.56, type: 'PUR' },
		{ barrelId: 1, date: offset(1), ordinal: 1, account: 'Credit', party: 'Less Johnsons', particulars: '349876234', code: 'Wellington', reference: '0499191354', amount: 94.27, type: 'PUR' },
		{ barrelId: 1, date: offset(2), ordinal: 0, account: 'Cheque', party: 'Buy n Eat Wellington', particulars: 'Porirua', code: '', reference: '', amount: 103.28, type: 'POS' },
		{ barrelId: 1, date: offset(2), ordinal: 1, account: 'Credit', party: 'Pipes ltd.', particulars: 'Christchurch', code: '', reference: '', amount: 85, type: 'PUR' },
		{ barrelId: 1, date: offset(2), ordinal: 2, account: 'Cheque', party: 'Octane Pump', particulars: 'Foxton', code: 'NZD71.21', reference: '', amount: 71.21, type: 'POS' },
		{ barrelId: 1, date: offset(3), ordinal: 0, account: 'Credit', party: 'Immobil', particulars: 'Levin', code: 'NZD43.29', reference: '', amount: 43.29, type: 'PUR' },
	],
	rule: [
		{ barrelId: 1, account: '', search: 'Pipes Christchurch', bucketId: 3 },
		{ barrelId: 1, account: '', search: 'BigBank', bucketId: 1 },
		{ barrelId: 1, account: '', search: 'Octane', bucketId: 4 },
	]
};
