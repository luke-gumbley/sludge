export const GET_BUCKETS_REQUEST = 'GET_BUCKETS_REQUEST';
export const GET_BUCKETS_RESPONSE = 'GET_BUCKETS_RESPONSE';
export const CREATE_BUCKET_REQUEST = 'CREATE_BUCKET_REQUEST';
export const CREATE_BUCKET_RESPONSE = 'CREATE_BUCKET_RESPONSE';

function getBucketsRequest() {
	return {
		type: GET_BUCKETS_REQUEST
	};
}

function getBucketsResponse(json) {
	return {
		type: GET_BUCKETS_RESPONSE,
		buckets: json
	};
}

function createBucketRequest(json) {
	return {
		type: CREATE_BUCKET_REQUEST,
		bucket: json
	};
}

function createBucketResponse(json) {
	return {
		type: CREATE_BUCKET_RESPONSE,
		bucket: json
	};
}

export function getBuckets() {
	return dispatch => {
		dispatch(getBucketsRequest());
		return fetch('http://localhost:8080/bucket')
			.then(response => response.json())
			.then(json => dispatch(getBucketsResponse(json)));
	};
}

export function createBucket(name) {
	return dispatch => {
		dispatch(createBucketRequest());
		return fetch('http://localhost:8080/bucket', {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name })
		}).then(response => response.json())
			.then(json => dispatch(createBucketResponse(json)));
	};
}

export function getBucket(name) {
	return (dispatch, getState) => {
		var bucket = Object.values(getState().buckets.items).find(b => b.name == name);
		return bucket ? Promise.resolve(bucket) : dispatch(createBucket(name));
	}
}
