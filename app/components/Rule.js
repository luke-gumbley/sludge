import React, { Component } from 'react';
import { connect } from 'react-redux';
import GlyphButton from './GlyphButton';
import { editRule, deleteRule } from '../actions/rules.js';

class Rule extends Component {

	handleEdit = () => this.props.dispatch(editRule(this.props.rule));

	handleDelete = () => this.props.dispatch(deleteRule(this.props.rule.id));

	render() {
		return (
			<div className="container">
				<div>{this.props.rule.account}</div>
				<div>{this.props.rule.search}</div>
				<div>{this.props.bucket.name}</div>
				<div>
					<GlyphButton glyph="pencil" onClick={this.handleEdit} />
					{'\u00A0'}
					<GlyphButton glyph="trash" onClick={this.handleDelete} />
				</div>
			</div>
		);
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.rule.bucketId] || { name: '' }
	};
}

export default connect(mapStateToProps)(Rule);
