import {
	GET_RULES_REQUEST,
	IMPORT_RULES_RESPONSE,
	GET_RULES_RESPONSE,
	CREATE_RULE_RESPONSE,
	PATCH_RULE_RESPONSE,
	EDIT_RULE,
} from '../actions/rules';

function rules(
	state = {
		isFetching: false,
		items: {},
		editRule: undefined
	},
	action
) {
	switch (action.type) {
		case GET_RULES_REQUEST:
			return Object.assign({}, state, {
				isFetching: true
			});
		case IMPORT_RULES_RESPONSE:
		case GET_RULES_RESPONSE:
			return Object.assign({}, state, {
				isFetching: false,
				items: action.rules.reduce((items, r) => { items[r.id] = r; return items; }, {})
			});
		case CREATE_RULE_RESPONSE:
		case PATCH_RULE_RESPONSE:
			var items = Object.assign({}, state.items);
			items[action.rule.id] = action.rule;
			return Object.assign({}, state, { items: items });
		case EDIT_RULE:
			return Object.assign({}, state, {
				editRule: action.rule
			});
		default:
			return state;
	}
}

export default rules;
