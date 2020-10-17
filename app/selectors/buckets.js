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
				if(bucket.isPeriodic)
					acc.rate = acc.rate.add(bucket.weekly);
				return acc;
			}, { name: budget, rate: Big(0), balance: Big(0) })
		).sort((a,b) => {
			return a.weekly.gt(b.weekly) ? -1 : a.weekly.lt(b.weekly) ? 1 :
				a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0;
		})
);
