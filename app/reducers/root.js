import { combineReducers } from 'redux';
import transactions from './transactions';
import buckets from './buckets';

const rootReducer = combineReducers({
	transactions,
	buckets
});

export default rootReducer;
