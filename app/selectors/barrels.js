import Big from 'big.js';
import { createSelector } from 'reselect'

const getStateBarrels = state => state.barrels.items;

export const getBarrels = createSelector(
	[getStateBarrels],
	barrels => Object.values(barrels)
);
