import { createSelector } from 'reselect'

const getStateBuckets = state => state.buckets.items;

export const getBuckets = createSelector(
	[getStateBuckets],
	buckets => Object.values(buckets)
);
