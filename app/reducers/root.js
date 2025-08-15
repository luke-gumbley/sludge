import { combineReducers } from 'redux';
import barrels from './barrels.js';
import transactions from './transactions.js';
import rules from './rules.js';
import buckets from './buckets.js';

const rootReducer = combineReducers({
	barrels,
	transactions,
	rules,
	buckets
});

export default function(state, action) {
	console.log(action.type);
	return rootReducer(state, action);
}
