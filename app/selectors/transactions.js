import { createSelector } from 'reselect'

const getTransactions = state => state.transactions.items;

export const getSortedTransactions = createSelector(
	[getTransactions],
	transactions => {
		const comparator = (a,b) =>
			a.date > b.date ? -1
			: a.date < b.date ? 1
			: a.ordinal > b.ordinal ? -1
			: 1;

		return Object.values(transactions).sort(comparator);
	}
);
