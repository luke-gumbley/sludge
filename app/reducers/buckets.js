import {
	REQUEST_BUCKETS,
	RECEIVE_BUCKETS
} from '../actions/buckets';

function buckets(
	state = {
		isFetching: false,
		items: []
	},
	action
) {
	switch (action.type) {
		case REQUEST_BUCKETS:
			return Object.assign({}, state, {
				isFetching: true
			});
		case RECEIVE_BUCKETS:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.buckets
			});
		default:
			return state;
	}
}

export default buckets;
