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
		.map(budget => ({
			name: budget,
			balance: buckets
				.filter(b => b.budget === budget)
				.reduce((balance, bucket) => { return bucket.calcBalance().add(balance); }, 0)
		}))
);
