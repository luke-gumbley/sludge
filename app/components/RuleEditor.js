import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';

import BucketPicker from './BucketPicker';
import { createRule, updateRule, editRule } from '../actions/rules.js';

class RuleEditor extends Component {

	handleSubmit = (evt) => {
		const inputs = evt.target.elements;
		const editing = this.props.defaultRule && Number.isInteger(this.props.defaultRule.id);

		let rule = {
			account: inputs['account'].value,
			search: inputs['search'].value,
			bucketName: inputs['bucket'].value
		};

		if(editing)
			rule.id = this.props.defaultRule.id;

		this.props.onRequestClose();
		this.props.onSubmit(rule, editing ? updateRule : createRule);

		evt.preventDefault();
	}

	render() {
		return (<Modal onRequestClose={this.props.onRequestClose} isOpen={!!this.props.defaultRule}>
			<form id='ruleForm' className='grid' onSubmit={this.handleSubmit}>
				<label htmlFor='ruleSearch'>Search:</label>
				<input id='ruleSearch' autoFocus name='search' defaultValue={this.props.rule.search} />

				<label htmlFor='ruleAccount'>Account:</label>
				<input id='ruleAccount' name='account' defaultValue={this.props.rule.account} />

				<label htmlFor='ruleBucket'>Bucket:</label>
				<BucketPicker name="bucket" bucketId={this.props.rule.bucketId} />

				<button className='button' type='button' onClick={this.props.onRequestClose}>Cancel</button>
				<button className='button' type='submit'>Save</button>
			</form>
		</Modal>);
	}
}

function mapStateToProps(state, props) {
	return {
		rule: props.defaultRule && props.defaultRule.id
			? state.rules.items[props.defaultRule.id]
			: Object.assign({ account: undefined, search: undefined }, props.defaultRule)
	};
}

function mapDispatchToProps(dispatch) {
	return {
		onSubmit: (rule, method) => dispatch(method(rule)),
		onRequestClose: () => dispatch(editRule())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RuleEditor);
