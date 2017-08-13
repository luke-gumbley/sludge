export const REQUEST_BUCKETS = 'REQUEST_BUCKETS';
export const RECEIVE_BUCKETS = 'RECEIVE_BUCKETS';

function requestBuckets() {
	return {
		type: REQUEST_BUCKETS
	};
}

function receiveBuckets(json) {
	return {
		type: RECEIVE_BUCKETS,
		buckets: json
	};
}

export function fetchBuckets() {
	return dispatch => {
		dispatch(requestBuckets());
		return fetch('http://localhost:8080/bucket')
			.then(response => response.json())
			.then(json => dispatch(receiveBuckets(json)));
	};
}
