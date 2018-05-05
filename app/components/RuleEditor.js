import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';

import { editRule } from '../actions/rules.js';

class RuleEditor extends Component {

	handleSubmit = (evt) => {
		const inputs = evt.target.elements;

		let bucket = {
			account: inputs['account'].value,
			search: inputs['search'].value,
		};

		if(this.props.ruleId !== null)
			rule.id = this.props.ruleId;

		this.props.onRequestClose();

		evt.preventDefault();
	}

	render() {
		return (<Modal onRequestClose={this.props.onRequestClose} isOpen={this.props.ruleId !== undefined}>
			<form id='ruleForm' className='grid' onSubmit={this.handleSubmit}>
				<label htmlFor='ruleSearch'>Search:</label>
				<input id='ruleSearch' autoFocus name='search' defaultValue={this.props.rule.search} />

				<label htmlFor='ruleAccount'>Account:</label>
				<input id='ruleAccount' name='account' defaultValue={this.props.rule.account} />

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
		onRequestClose: () => dispatch(editRule(undefined))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RuleEditor);
