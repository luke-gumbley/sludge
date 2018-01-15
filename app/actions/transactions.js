import {applyPatch, createPatch, createTests} from 'rfc6902';
import Big from 'big.js';
import moment from 'Moment';

import {getBucket} from './buckets';

export const GET_TRANSACTIONS_REQUEST = 'GET_TRANSACTIONS_REQUEST';
export const GET_TRANSACTIONS_RESPONSE = 'GET_TRANSACTIONS_RESPONSE';
export const PATCH_TRANSACTION_REQUEST = 'PATCH_TRANSACTION_REQUEST';
export const PATCH_TRANSACTION_RESPONSE = 'PATCH_TRANSACTION_RESPONSE';
export const POST_STATEMENT_REQUEST = 'POST_STATEMENT_REQUEST';
export const POST_STATEMENT_RESPONSE = 'POST_STATEMENT_RESPONSE';

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

function augment(transactions) {
	if(!Array.isArray(transactions))
		return augment([transactions])[0];

	transactions.forEach(transaction => {
		transaction.date = moment(transaction.date);
		transaction.amount = new Big(transaction.amount);
	});

	return transactions;
}

export function getTransactions() {
	return dispatch => {
		dispatch(getTransactionsRequest());
		return fetch('https://localhost:8443/api/transaction')
			.then(response => response.json())
			.then(augment)
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
	return fetch('https://localhost:8443/api/transaction/' + id, {
			method: 'PATCH',
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(patch),
		}).then(response => response.json())
			.then(augment)
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

export function postStatementRequest() {
	return {
		type: POST_STATEMENT_REQUEST
	};
}

export function postStatementResponse() {
	return {
		type: POST_STATEMENT_RESPONSE
	};
}

export function postStatement(filename, data) {
	return dispatch => {
		dispatch(postStatementRequest());
		return fetch(`/statements/${filename}`, {
				method: 'POST',
				headers: { "Content-Type": "application/octet-stream" },
				body: data
			}).then(() => {
				dispatch(postStatementResponse());
				return dispatch(getTransactions()); // super naive
			}).catch(ex => {console.log('whoops!'); console.log(ex); });

	};
}
