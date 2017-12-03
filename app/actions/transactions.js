import {applyPatch, createPatch, createTests} from 'rfc6902';
import {getBucket} from './buckets';

export const GET_TRANSACTIONS_REQUEST = 'GET_TRANSACTIONS_REQUEST';
export const GET_TRANSACTIONS_RESPONSE = 'GET_TRANSACTIONS_RESPONSE';
export const PATCH_TRANSACTION_REQUEST = 'PATCH_TRANSACTION_REQUEST';
export const PATCH_TRANSACTION_RESPONSE = 'PATCH_TRANSACTION_RESPONSE';

function getTransactionsRequest() {
	return {
		type: GET_TRANSACTIONS_REQUEST
	};
}

function getTransactionsResponse(transactions) {
	return {
		type: GET_TRANSACTIONS_RESPONSE,
		transactions: transactions
	};
}

export function getTransactions() {
	return dispatch => {
		dispatch(getTransactionsRequest());
		return fetch('http://localhost:8080/transaction')
			.then(response => response.json())
			.then(transactions => dispatch(getTransactionsResponse(transactions)));
	};
}

export function patchTransactionRequest(id) {
	return {
		type: PATCH_TRANSACTION_REQUEST,
		id: id
	};
}

export function patchTransactionResponse(transaction) {
	return {
		type: PATCH_TRANSACTION_RESPONSE,
		transaction: transaction
	};
}

function patchTransaction(dispatch, id, patch) {
	dispatch(patchTransactionRequest(id));
	return fetch('http://localhost:8080/transaction/' + id, {
			method: 'PATCH',
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(patch),
		}).then(response => response.json())
		.then(transaction => dispatch(patchTransactionResponse(transaction)))
		.catch(ex => {console.log('whoops!'); console.log(ex); });
}

export function categoriseTransaction(id, bucketName) {
	return dispatch => {
		(bucketName ? dispatch(getBucket(bucketName)) : Promise.resolve({ id: null }))
			.then(bucket => {
				return patchTransaction(dispatch, id, [{ "op": "replace", "path": "/bucketId", "value": bucket.id }]);
			});
	};
}
