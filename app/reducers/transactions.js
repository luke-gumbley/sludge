import {
	REQUEST_TRANSACTIONS,
	RECEIVE_TRANSACTIONS
} from '../actions/transactions';

function transactions(
	state = {
		isFetching: false,
		items: {}
	},
	action
) {
	switch (action.type) {
		case REQUEST_TRANSACTIONS:
			return Object.assign({}, state, {
				isFetching: true
			});
		case RECEIVE_TRANSACTIONS:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.transactions.reduce((items, t) => { items[t.id] = t; return items; }, {})
			});
		default:
			return state;
	}
}

export default transactions;
