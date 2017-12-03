import {
	GET_TRANSACTIONS_REQUEST,
	GET_TRANSACTIONS_RESPONSE,
	PATCH_TRANSACTION_RESPONSE
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
		case PATCH_TRANSACTION_RESPONSE:
			var items = Object.assign({}, state.items);
			items[action.transaction.id] = action.transaction;
			return Object.assign({}, state, { items: items });
		default:
			return state;
	}
}

export default transactions;
