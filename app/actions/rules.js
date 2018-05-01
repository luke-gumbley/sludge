export const GET_RULES_REQUEST = 'GET_RULES_REQUEST';
export const GET_RULES_RESPONSE = 'GET_RULES_RESPONSE';
export const EDIT_RULE = 'EDIT_RULE';

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
