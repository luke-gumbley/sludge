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
				acc.projected = acc.projected.add(calc.projected);
				acc.variance = acc.variance.add(calc.variance);
				return acc;
			}, { name: budget, projected: Big(0), variance: Big(0) })
		)
);
