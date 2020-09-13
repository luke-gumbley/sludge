import {
	GET_TRANSACTIONS_REQUEST,
	GET_TRANSACTIONS_RESPONSE,
	PATCH_TRANSACTION_RESPONSE,
	UPDATE_FILTER
} from '../actions/transactions';

function transactions(
	state = {
		isFetching: false,
		filter: { bucketId: undefined, account: undefined, search: undefined },
		items: {},
		total: undefined,
		layout:[{label:'Date', width:1},
			{label:'Account', width:1},
			{label:'Type', width:1},
			{label:'Party', width:1},
			{label:'Particulars', width:1},
			{label:'Code', width:1},
			{label:'Reference', width:1},
			{label:'Amount', width:1},
			{label:'Bucket', width:1}]
	},
	action
) {
	switch (action.type) {
		case GET_TRANSACTIONS_REQUEST:
			return Object.assign({}, state, {
				isFetching: true
			});
		case GET_TRANSACTIONS_RESPONSE: {
			const items = Object.assign({}, state.items)
			action.transactions.forEach(t => items[t.id] = t);

			return Object.assign({}, state, {
				isFetching: false,
				items,
				total: action.total
			});
		}
		case PATCH_TRANSACTION_RESPONSE: {
			const items = Object.assign({}, state.items);
			items[action.transaction.id] = Object.assign({}, items[action.transaction.id], action.transaction);
			return Object.assign({}, state, { items });
		}
		case UPDATE_FILTER: {
			const filter = Object.assign({}, state.filter, action.filter);
			return Object.assign({}, state, { isFetching: false, filter, items: {}, total: undefined });
		}
		default:
			return state;
	}
}

export default transactions;
