import {
	REQUEST_BUCKETS,
	RECEIVE_BUCKETS,
	RECEIVE_BUCKET
} from '../actions/buckets';

function buckets(
	state = {
		isFetching: false,
		items: {}
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
				items: action.buckets.reduce((items, b) => { items[b.id] = b; return items; }, {})
			});
		case RECEIVE_BUCKET:
			var items = Object.assign({}, state.items);
			items[action.bucket.id] = action.bucket;
			return Object.assign({}, state, { items: items });
		default:
			return state;
	}
}

export default buckets;
