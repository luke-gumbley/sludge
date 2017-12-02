import {
	REQUEST_BUCKETS,
	RECEIVE_BUCKETS,
	RECEIVE_BUCKET
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
		case RECEIVE_BUCKET:
			return Object.assign({}, state, {
				items: (state.items || []).filter(b => b.id !==  action.bucket.id).concat([action.bucket])
			});
		default:
			return state;
	}
}

export default buckets;
