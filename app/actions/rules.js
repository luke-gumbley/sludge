import { getBucket } from './buckets.js'

export const GET_RULES_REQUEST = 'GET_RULES_REQUEST';
export const GET_RULES_RESPONSE = 'GET_RULES_RESPONSE';
export const EDIT_RULE = 'EDIT_RULE';
export const CREATE_RULE_REQUEST = 'CREATE_RULE_REQUEST';
export const CREATE_RULE_RESPONSE = 'CREATE_RULE_RESPONSE';
export const PATCH_RULE_REQUEST = 'PATCH_RULE_REQUEST';
export const PATCH_RULE_RESPONSE = 'PATCH_RULE_RESPONSE';

function getRulesRequest() {
	return {
		type: GET_RULES_REQUEST
	};
}

function getRulesResponse(rules) {
	return {
		type: GET_RULES_RESPONSE,
		rules
	};
}

export function getRules() {
	return dispatch => {
		dispatch(getRulesRequest());
		return fetch('/api/rules')
			.then(response => response.json())
			.then(rules => dispatch(getRulesResponse(rules)));
	};
}

export function editRule(id) {
	return {
		type: EDIT_RULE,
		id
	};
}

function createRuleRequest(rule) {
	return {
		type: CREATE_RULE_REQUEST,
		rule
	};
}

function createRuleResponse(rule) {
	return {
		type: CREATE_RULE_RESPONSE,
		rule
	};
}

function populateBucket(dispatch, rule) {
	const bucketPromise = Number.isInteger(rule.bucketId)
		? Promise.resolve({ id: rule.bucketId })
		: dispatch(getBucket(rule.bucketName))

	return bucketPromise.then(bucket => {
		if(rule.bucketName)
			delete rule.bucketName;

		rule.bucketId = bucket.id;
		return rule;
	});
}

export function createRule(rule) {
	return dispatch => {
		populateBucket(dispatch, rule)
			.then(rule => {
				dispatch(createRuleRequest(rule));
				return fetch('/api/rules', {
					method: 'POST',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(rule)
				})
			})
			.then(response => response.json())
			.then(rule => {
				dispatch(createRuleResponse(rule));
				return rule;
			});
	};
}

export function patchRuleRequest(id) {
	return {
		type: PATCH_RULE_REQUEST,
		id
	};
}

export function patchRuleResponse(rule) {
	return {
		type: PATCH_RULE_RESPONSE,
		rule
	};
}

function patchRule(dispatch, id, patch) {
	dispatch(patchRuleRequest(id));
	return fetch('/api/rules/' + id, {
			method: 'PATCH',
			headers: { "Content-Type": "application/json-patch+json" },
			body: JSON.stringify(patch),
		}).then(response => response.json())
			.then(rule => dispatch(patchRuleResponse(rule)))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
}

export function updateRule(rule) {
	return dispatch => {
		populateBucket(dispatch, rule)
			.then(rule => {
				const patch = Object.getOwnPropertyNames(rule)
					.filter(prop => prop != 'id')
					.map(prop => ({ "op": "replace", "path": `/${prop}`, "value": rule[prop] }));

				return patchRule(dispatch, rule.id, patch);;
			})
	};
}
