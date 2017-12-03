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

function getTransactionsResponse(json) {
	return {
		type: GET_TRANSACTIONS_RESPONSE,
		transactions: json
	};
}

export function getTransactions() {
	return dispatch => {
		dispatch(getTransactionsRequest());
		return fetch('http://localhost:8080/transaction')
			.then(response => response.json())
			.then(json => dispatch(getTransactionsResponse(json)));
	};
}

export function patchTransactionRequest(id) {
	return {
		type: PATCH_TRANSACTION_REQUEST,
		id: id
	};
}

export function patchTransactionResponse(id) {
	return {
		type: PATCH_TRANSACTION_RESPONSE,
		id: id
	};
}

function patchTransaction(dispatch, id, patch) {
	dispatch(patchTransactionRequest(id));
	return fetch('http://localhost:8080/transaction/' + id, {
			method: 'PATCH',
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(patch),
		}).then(json => dispatch(patchTransactionResponse(id)))
		.catch(ex => {console.log('whoops!'); console.log(ex); });
}

export function categoriseTransaction(id, bucketName) {
	return dispatch => {
		dispatch(getBucket(bucketName))
			.then(bucket => {
				return patchTransaction(dispatch, id, [{ "op": "replace", "path": "/bucketId", "value": bucket.id }]);
			});
	};
}
