import {
	GET_TRANSACTIONS_REQUEST,
	GET_TRANSACTIONS_RESPONSE
} from '../actions/transactions';

function transactions(
	state = {
		isFetching: false,
		items: {}
	},
	action
) {
	switch (action.type) {
		case GET_TRANSACTIONS_REQUEST:
			return Object.assign({}, state, {
				isFetching: true
			});
		case GET_TRANSACTIONS_RESPONSE:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.transactions.reduce((items, t) => { items[t.id] = t; return items; }, {})
			});
		default:
			return state;
	}
}

export default transactions;
