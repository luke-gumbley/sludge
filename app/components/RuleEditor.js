import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';

import BucketPicker from './BucketPicker';
import { createRule, updateRule, editRule } from '../actions/rules.js';

class RuleEditor extends Component {

	handleSubmit = (evt) => {
		const inputs = evt.target.elements;

		let rule = {
			account: inputs['account'].value,
			search: inputs['search'].value,
			bucketName: inputs['bucket'].value
		};

		if(this.props.ruleId !== null)
			rule.id = this.props.ruleId;

		this.props.onRequestClose();
		this.props.onSubmit(rule, this.props.ruleId !== null ? updateRule : createRule);

		evt.preventDefault();
	}

	render() {
		return (<Modal onRequestClose={this.props.onRequestClose} isOpen={this.props.ruleId !== undefined}>
			<form id='ruleForm' className='grid' onSubmit={this.handleSubmit}>
				<label htmlFor='ruleSearch'>Search:</label>
				<input id='ruleSearch' autoFocus name='search' defaultValue={this.props.rule.search} />

				<label htmlFor='ruleAccount'>Account:</label>
				<input id='ruleAccount' name='account' defaultValue={this.props.rule.account} />

				<label htmlFor='ruleBucket'>Bucket:</label>
				<BucketPicker bucketId={this.props.rule.bucketId} />

				<span className='button' onClick={this.props.onRequestClose}>Cancel</span>
				<button className='button' type='submit'>Save</button>
			</form>
		</Modal>);
	}
}

function mapStateToProps(state, props) {
	return {
		rule: state.rules.items[props.ruleId] || { account: undefined, search: undefined }
	};
}

function mapDispatchToProps(dispatch) {
	return {
		onSubmit: (rule, method) => dispatch(method(rule)),
		onRequestClose: () => dispatch(editRule(undefined))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RuleEditor);
