import {
	GET_TRANSACTIONS_REQUEST,
	GET_TRANSACTIONS_RESPONSE,
	PATCH_TRANSACTION_RESPONSE
} from '../actions/transactions';

function transactions(
	state = {
		isFetching: false,
		items: {},
		total: 1,
	},
	action
) {
	switch (action.type) {
		case GET_TRANSACTIONS_REQUEST:
			return Object.assign({}, state, {
				isFetching: true
			});
		case GET_TRANSACTIONS_RESPONSE:
			const items = Object.assign({}, state.items)
			action.transactions.forEach(t => items[t.id] = t);

			return Object.assign({}, state, {
				isFetching: false,
				items,
				total: action.total
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
