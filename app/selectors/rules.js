import { createSelector } from 'reselect'

const getStateRules = state => state.rules.items;

export const getRules = createSelector(
	[getStateRules],
	rules => Object.values(rules)
);
