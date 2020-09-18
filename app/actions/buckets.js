import Big from 'big.js';
import moment from 'moment';

export const GET_BUCKETS_REQUEST = 'GET_BUCKETS_REQUEST';
export const GET_BUCKETS_RESPONSE = 'GET_BUCKETS_RESPONSE';
export const CREATE_BUCKET_REQUEST = 'CREATE_BUCKET_REQUEST';
export const CREATE_BUCKET_RESPONSE = 'CREATE_BUCKET_RESPONSE';
export const PATCH_BUCKET_REQUEST = 'PATCH_BUCKET_REQUEST';
export const PATCH_BUCKET_RESPONSE = 'PATCH_BUCKET_RESPONSE';
export const EDIT_BUCKET = 'EDIT_BUCKET';
export const IMPORT_BUCKETS_REQUEST = 'IMPORT_BUCKETS_REQUEST';
export const IMPORT_BUCKETS_RESPONSE = 'IMPORT_BUCKETS_RESPONSE';
export const DELETE_BUCKET_REQUEST = 'DELETE_BUCKET_REQUEST';
export const DELETE_BUCKET_RESPONSE = 'DELETE_BUCKET_RESPONSE';

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
		bucket.date = moment(bucket.date);
		bucket.zeroDate = moment(bucket.zeroDate);
		bucket.amount = new Big(bucket.amount);
		bucket.balance = new Big(bucket.balance);

		bucket.isPeriodic = bucket.date.isValid() && bucket.period > 0;

		const prev = moment(bucket.date).subtract(bucket.period,bucket.periodUnit);
		bucket.periodDays = bucket.date.diff(prev, 'days', true);

		bucket.calculate = function calculate() {
			const nextEmpty = moment(this.date);
			if(moment().isAfter(nextEmpty)) {
				const diff = moment().diff(nextEmpty, this.periodUnit, true);
				const periods = Math.ceil(diff / this.period);
				nextEmpty.add(this.period * periods, this.periodUnit);
			}

			let lastEmpty = nextEmpty.subtract(this.period, this.periodUnit);
			if(this.zeroDate.isAfter(lastEmpty))
				lastEmpty = moment(this.zeroDate);

			let increment = lastEmpty.isAfter(moment())
				? 0
				: moment().diff(lastEmpty, 'days', true) / this.periodDays;

			const age = this.zeroDate.isAfter(moment())
				? 0
				: moment().diff(this.zeroDate, 'days', true) / this.periodDays;

			const projected = this.amount.mul(increment);
			const actual = this.amount.mul(age);
			const variance = this.balance.add(actual).sub(projected);

			return { nextEmpty, projected, actual, variance };

		}
	});

	return buckets;
}

export function getBuckets() {
	return dispatch => {
		dispatch(getBucketsRequest());
		return fetch('/api/buckets')
			.then(response => response.json())
			.then(augment)
			.then(buckets => dispatch(getBucketsResponse(buckets)));
	};
}

export function createBucket(bucket) {
	return dispatch => {
		dispatch(createBucketRequest(bucket));
		return fetch('/api/buckets', {
			method: 'POST',
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
		return bucket ? Promise.resolve(bucket) : dispatch(createBucket({ name, period: 0, budget: 'Extra' }));
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
	return fetch('/api/buckets/' + id, {
			method: 'PATCH',
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

export function importBucketsRequest() {
	return {
		type: IMPORT_BUCKETS_REQUEST
	};
}

export function importBucketsResponse(buckets) {
	return {
		type: IMPORT_BUCKETS_RESPONSE,
		buckets
	};
}

export function importBuckets(data) {
	return dispatch => {
		dispatch(importBucketsRequest());
		return fetch(`/api/buckets/import`, {
				method: 'POST',
				headers: { "Content-Type": "text/csv" },
				body: data
			}).then(res => res.json())
			.then(augment)
			.then(buckets => dispatch(importBucketsResponse(buckets)))
			.catch(ex => {console.log('whoops!'); console.log(ex); });

	};
}

export function deleteBucketRequest(id) {
	return {
		type: DELETE_BUCKET_REQUEST,
		id
	};
}

export function deleteBucketResponse(id) {
	return {
		type: DELETE_BUCKET_RESPONSE,
		id
	};
}

export function deleteBucket(id) {
	return dispatch => {
		dispatch(deleteBucketRequest(id));
		return fetch(`/api/buckets/${id}`, { method: 'DELETE' })
			.then(() => dispatch(deleteBucketResponse(id)))
			.catch(console.log);
	};
}
