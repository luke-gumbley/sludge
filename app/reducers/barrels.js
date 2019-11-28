import {
	GET_BARRELS_REQUEST,
	GET_BARRELS_RESPONSE,
} from '../actions/barrels';

function barrels(
	state = {
		isFetching: false,
		barrelId: undefined,
		items: {}
	},
	action
) {
	let items;
	switch (action.type) {
		case GET_BARRELS_REQUEST:
			return Object.assign({}, state, {
				isFetching: true
			});
		case GET_BARRELS_RESPONSE:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.barrels.reduce((items, b) => { items[b.id] = b; return items; }, {})
			});
		default:
			return state;
	}
}

export default barrels;
