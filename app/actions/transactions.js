export const REQUEST_TRANSACTIONS = 'REQUEST_TRANSACTIONS';
export const RECEIVE_TRANSACTIONS = 'RECEIVE_TRANSACTIONS';

function requestTransactions() {
	return {
		type: REQUEST_TRANSACTIONS
	};
}

function receiveTransactions(json) {
	return {
		type: RECEIVE_TRANSACTIONS,
		transactions: json
	};
}

export function fetchTransactions() {
	return dispatch => {
		dispatch(requestTransactions());
		return fetch('http://localhost:8080/transaction')
			.then(response => response.json())
			.then(json => dispatch(receiveTransactions(json)));
	};
}
