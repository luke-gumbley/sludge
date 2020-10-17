import Big from 'big.js';
import { createSelector } from 'reselect'

const getStateBuckets = state => state.buckets.items;

export const getBuckets = createSelector(
	[getStateBuckets],
	buckets => Object.values(buckets)
);

export const getBudgets = createSelector(
	[getBuckets],
	buckets => buckets.map(bucket => bucket.budget)
		.filter((b,i,a) => b && a.indexOf(b) === i)
		.map(budget => buckets.filter(b => b.isPeriodic && b.budget === budget)
			.reduce((acc, bucket) => {
				const calc = bucket.calculate();
				if(calc.actual.gt(0))
					acc.balance = acc.balance.add(calc.actual);
				return acc;
			}, { name: budget, balance: Big(0) })
		)
);
