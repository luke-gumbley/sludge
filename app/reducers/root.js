import { combineReducers } from 'redux';
import barrels from './barrels';
import transactions from './transactions';
import rules from './rules';
import buckets from './buckets';

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
