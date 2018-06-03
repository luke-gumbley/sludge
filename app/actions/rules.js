import { getBucket } from './buckets.js'
import { updateFilter } from './transactions.js'

export const GET_RULES_REQUEST = 'GET_RULES_REQUEST';
export const GET_RULES_RESPONSE = 'GET_RULES_RESPONSE';
export const EDIT_RULE = 'EDIT_RULE';
export const CREATE_RULE_REQUEST = 'CREATE_RULE_REQUEST';
export const CREATE_RULE_RESPONSE = 'CREATE_RULE_RESPONSE';
export const PATCH_RULE_REQUEST = 'PATCH_RULE_REQUEST';
export const PATCH_RULE_RESPONSE = 'PATCH_RULE_RESPONSE';
export const IMPORT_RULES_REQUEST = 'IMPORT_RULES_REQUEST';
export const IMPORT_RULES_RESPONSE = 'IMPORT_RULES_RESPONSE';
export const APPLY_RULES_REQUEST = 'APPLY_RULES_REQUEST';
export const APPLY_RULES_RESPONSE = 'APPLY_RULES_RESPONSE';
export const DELETE_RULE_REQUEST = 'DELETE_RULE_REQUEST';
export const DELETE_RULE_RESPONSE = 'DELETE_RULE_RESPONSE';

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

export function editRule(rule) {
	return {
		type: EDIT_RULE,
		rule
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
				dispatch(applyRules(rule.id));
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
			.then(rule => {
				const dispatched = dispatch(patchRuleResponse(rule));
				dispatch(applyRules(rule.id));
				return dispatched;
			})
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

export function importRulesRequest() {
	return {
		type: IMPORT_RULES_REQUEST
	};
}

export function importRulesResponse(rules) {
	return {
		type: IMPORT_RULES_RESPONSE,
		rules
	};
}

export function importRules(data) {
	return dispatch => {
		dispatch(importRulesRequest());
		return fetch(`/api/rules/import`, {
				method: 'POST',
				headers: { "Content-Type": "text/csv" },
				body: data
			}).then(res => res.json())
			.then(rules => {
				const dispatched = dispatch(importRulesResponse(rules));
				dispatch(applyRules());
				return dispatched;
			})
			.catch(ex => {console.log('whoops!'); console.log(ex); });

	};
}

export function applyRulesRequest(ruleId) {
	return {
		type: APPLY_RULES_REQUEST,
		ruleId
	};
}

export function applyRulesResponse(results) {
	return {
		type: APPLY_RULES_RESPONSE,
		results
	};
}

export function applyRules(ruleId) {
	return dispatch => {
		dispatch(applyRulesRequest());
		return fetch(ruleId ? `/api/rules/${ruleId}/apply` : '/api/rules/apply', {
				method: 'POST'
			}).then(res => res.json())
			.then(res => {
				const results = ruleId ? [] : res;
				if(ruleId) results[res.ruleId] = res.transactions;
				const dispatched = dispatch(applyRulesResponse(results));

				const transactions = results.reduce((n, t) => n + t);
				if(transactions) dispatch(updateFilter({}));

				return dispatched;
			})
			.catch(ex => {console.log('whoops!'); console.log(ex); });
	};
}

export function deleteRuleRequest(id) {
	return {
		type: DELETE_RULE_REQUEST,
		id
	};
}

export function deleteRuleResponse(id) {
	return {
		type: DELETE_RULE_RESPONSE,
		id
	};
}

export function deleteRule(id) {
	return dispatch => {
		dispatch(deleteRuleRequest(id));
		return fetch(`/api/rules/${id}`, { method: 'DELETE' })
			.then(() => dispatch(deleteRuleResponse(id)))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
	};
}
