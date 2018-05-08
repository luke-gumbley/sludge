import React, { Component } from 'react';
import { connect } from 'react-redux';
import GlyphButton from './GlyphButton';
import { editRule } from '../actions/rules.js';

class Rule extends Component {

	render() {
		return (
			<div className="container">
				<div>{this.props.rule.account}</div>
				<div>{this.props.rule.search}</div>
				<div>{this.props.bucket.name}</div>
				<div><GlyphButton glyph="pencil" onClick={() => this.props.onEdit(this.props.rule.id)} /></div>
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onEdit: id => dispatch(editRule(id))
	};
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.rule.bucketId] || { name: '' }
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(Rule);
