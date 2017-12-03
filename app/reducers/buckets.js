import {
	GET_BUCKETS_REQUEST,
	GET_BUCKETS_RESPONSE,
	CREATE_BUCKET_RESPONSE
} from '../actions/buckets';

function buckets(
	state = {
		isFetching: false,
		items: {}
	},
	action
) {
	switch (action.type) {
		case GET_BUCKETS_REQUEST:
			return Object.assign({}, state, {
				isFetching: true
			});
		case GET_BUCKETS_RESPONSE:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.buckets.reduce((items, b) => { items[b.id] = b; return items; }, {})
			});
		case CREATE_BUCKET_RESPONSE:
			var items = Object.assign({}, state.items);
			items[action.bucket.id] = action.bucket;
			return Object.assign({}, state, { items: items });
		default:
			return state;
	}
}

export default buckets;
