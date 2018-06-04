import { createSelector } from 'reselect'

const getTransactions = state => state.transactions.items;

export const getSortedTransactions = createSelector(
	[getTransactions],
	transactions => {
		const comparator = (a,b) =>
			a.index < b.index ? -1
			: a.index > b.index ? 1
			: 0;

		return Object.values(transactions).sort(comparator);
	}
);
