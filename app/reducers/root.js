import { combineReducers } from 'redux';
import transactions from './transactions';
import rules from './rules';
import buckets from './buckets';

const rootReducer = combineReducers({
	transactions,
	rules,
	buckets
});

export default function(state, action) {
	console.log(action.type);
	return rootReducer(state, action);
}
