import { getBucket } from './buckets.js'

export const GET_RULES_REQUEST = 'GET_RULES_REQUEST';
export const GET_RULES_RESPONSE = 'GET_RULES_RESPONSE';
export const EDIT_RULE = 'EDIT_RULE';
export const CREATE_RULE_REQUEST = 'CREATE_RULE_REQUEST';
export const CREATE_RULE_RESPONSE = 'CREATE_RULE_RESPONSE';

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

export function createRule(rule) {
	return dispatch => {
		(Number.isInteger(rule.bucketId) ? Promise.resolve({ id: rule.bucketId }) : dispatch(getBucket(rule.bucket)))
			.then(bucket => {
				if(rule.bucket)
					delete rule.bucket;

				rule.bucketId = bucket.id;

				dispatch(createRuleRequest(rule));
				return fetch('/api/rules', {
					method: 'POST',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(rule)
				}).then(response => response.json())
					.then(rule => {
						dispatch(createRuleResponse(rule));
						return rule;
					});
			});
	};
}
