import React, { Component } from 'react';
import { connect } from 'react-redux';
import GlyphButton from './GlyphButton';

class Rule extends Component {

	render() {
		return (
			<div className="container">
				<div>{this.props.rule.account}</div>
				<div>{this.props.rule.search}</div>
				<div>{this.props.bucket.name}</div>
				<div><GlyphButton glyph="pencil"/></div>
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
