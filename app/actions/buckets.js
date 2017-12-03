export const REQUEST_BUCKETS = 'REQUEST_BUCKETS';
export const RECEIVE_BUCKETS = 'RECEIVE_BUCKETS';
export const RECEIVE_BUCKET = 'RECEIVE_BUCKET';

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

function receiveBucket(json) {
	return {
		type: RECEIVE_BUCKET,
		bucket: json
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

export function createBucket(name) {
	return dispatch => {
		dispatch(requestBuckets());
		return fetch('http://localhost:8080/bucket', {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name })
		}).then(response => response.json())
			.then(json => dispatch(receiveBucket(json)));
	};
}

export function getBucket(name) {
	return (dispatch, getState) => {
		var bucket = Object.values(getState().buckets.items).find(b => b.name == name);
		return bucket ? Promise.resolve(bucket) : dispatch(createBucket(name));
	}
}
