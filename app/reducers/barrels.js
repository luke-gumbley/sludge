import {
	GET_BARRELS_REQUEST,
	GET_BARRELS_RESPONSE,
	SET_BARREL_REQUEST,
	SET_BARREL_RESPONSE,
} from '../actions/barrels';

function barrels(
	state = {
		isFetching: false,
		isAuthorising: false,
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
		case SET_BARREL_REQUEST:
			return Object.assign({}, state, {
				isAuthorising: true
			});
		case SET_BARREL_RESPONSE:
			return Object.assign({}, state, {
				isAuthorising: false,
				barrelId: action.barrelId
			});
		default:
			return state;
	}
}

export default barrels;
