import Big from 'big.js';
import moment from 'Moment';

export const GET_BUCKETS_REQUEST = 'GET_BUCKETS_REQUEST';
export const GET_BUCKETS_RESPONSE = 'GET_BUCKETS_RESPONSE';
export const CREATE_BUCKET_REQUEST = 'CREATE_BUCKET_REQUEST';
export const CREATE_BUCKET_RESPONSE = 'CREATE_BUCKET_RESPONSE';

function getBucketsRequest() {
	return {
		type: GET_BUCKETS_REQUEST
	};
}

function getBucketsResponse(buckets) {
	return {
		type: GET_BUCKETS_RESPONSE,
		buckets: buckets
	};
}

function createBucketRequest(name) {
	return {
		type: CREATE_BUCKET_REQUEST,
		name: name
	};
}

function createBucketResponse(bucket) {
	return {
		type: CREATE_BUCKET_RESPONSE,
		bucket: bucket
	};
}

export function getBuckets() {
	return dispatch => {
		dispatch(getBucketsRequest());
		return fetch('http://localhost:8080/bucket')
			.then(response => response.json())
			.then(buckets => {
				buckets.forEach(bucket => {
					bucket.nextDate = moment(bucket.nextDate);
					bucket.amount = new Big(bucket.amount);
					bucket.balance = new Big(bucket.balance);
				})
				return dispatch(getBucketsResponse(buckets));
			});
	};
}

export function createBucket(name) {
	return dispatch => {
		dispatch(createBucketRequest(name));
		return fetch('http://localhost:8080/bucket', {
			method: 'POST',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name })
		}).then(response => response.json())
			.then(bucket => {
				dispatch(createBucketResponse(bucket));
				return bucket;
			});
	};
}

export function getBucket(name) {
	return (dispatch, getState) => {
		var bucket = Object.values(getState().buckets.items).find(b => b.name == name);
		return bucket ? Promise.resolve(bucket) : dispatch(createBucket(name));
	}
}
