import Big from 'big.js';
import moment from 'Moment';

export const GET_BUCKETS_REQUEST = 'GET_BUCKETS_REQUEST';
export const GET_BUCKETS_RESPONSE = 'GET_BUCKETS_RESPONSE';
export const CREATE_BUCKET_REQUEST = 'CREATE_BUCKET_REQUEST';
export const CREATE_BUCKET_RESPONSE = 'CREATE_BUCKET_RESPONSE';
export const PATCH_BUCKET_REQUEST = 'PATCH_BUCKET_REQUEST';
export const PATCH_BUCKET_RESPONSE = 'PATCH_BUCKET_RESPONSE';
export const EDIT_BUCKET = 'EDIT_BUCKET';

function getBucketsRequest() {
	return {
		type: GET_BUCKETS_REQUEST
	};
}

function getBucketsResponse(buckets) {
	return {
		type: GET_BUCKETS_RESPONSE,
		buckets
	};
}

function createBucketRequest(bucket) {
	return {
		type: CREATE_BUCKET_REQUEST,
		bucket
	};
}

function createBucketResponse(bucket) {
	return {
		type: CREATE_BUCKET_RESPONSE,
		bucket
	};
}

function augment(buckets) {
	if(!Array.isArray(buckets))
		return augment([buckets])[0];

	buckets.forEach(bucket => {
		bucket.nextDate = moment(bucket.nextDate);
		bucket.zeroDate = moment(bucket.zeroDate);
		bucket.amount = new Big(bucket.amount);
		bucket.balance = new Big(bucket.balance);
	});

	return buckets;
}

export function getBuckets() {
	return dispatch => {
		dispatch(getBucketsRequest());
		return fetch('https://localhost:8443/api/bucket', { credentials: 'same-origin' })
			.then(response => response.json())
			.then(augment)
			.then(buckets => dispatch(getBucketsResponse(buckets)));
	};
}

export function createBucket(bucket) {
	return dispatch => {
		dispatch(createBucketRequest(bucket));
		return fetch('https://localhost:8443/api/bucket', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(bucket)
		}).then(response => response.json())
			.then(augment)
			.then(bucket => {
				dispatch(createBucketResponse(bucket));
				return bucket;
			});
	};
}

export function getBucket(name) {
	return (dispatch, getState) => {
		var bucket = Object.values(getState().buckets.items).find(b => b.name == name);
		return bucket ? Promise.resolve(bucket) : dispatch(createBucket({ name }));
	}
}

export function patchBucketRequest(id) {
	return {
		type: PATCH_BUCKET_REQUEST,
		id
	};
}

export function patchBucketResponse(bucket) {
	return {
		type: PATCH_BUCKET_RESPONSE,
		bucket
	};
}

function patchBucket(dispatch, id, patch) {
	dispatch(patchBucketRequest(id));
	return fetch('https://localhost:8443/api/bucket/' + id, {
			method: 'PATCH',
			credentials: 'same-origin',
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(patch),
		}).then(response => response.json())
			.then(augment)
			.then(bucket => dispatch(patchBucketResponse(bucket)))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
}

export function updateBucket(bucket) {
	return dispatch => {
		const patch = Object.getOwnPropertyNames(bucket)
			.filter(prop => prop != 'id')
			.map(prop => ({ "op": "replace", "path": `/${prop}`, "value": bucket[prop] }));

		return patchBucket(dispatch, bucket.id, patch);;
	};
}

export function editBucket(id) {
	return {
		type: EDIT_BUCKET,
		id
	};
}
