import { combineReducers } from 'redux';
import transactions from './transactions';
import buckets from './buckets';

const rootReducer = combineReducers({
	transactions,
	buckets
});

export default function(state, action) {
	console.log(action.type);
	return rootReducer(state, action);
}
