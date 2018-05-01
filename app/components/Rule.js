import React, { Component } from 'react';
import { connect } from 'react-redux';
import GlyphButton from './GlyphButton';

export default class Rule extends Component {

	render() {
		return (
			<div className="container">
				<div>{this.props.rule.account}</div>
				<div>{this.props.rule.search}</div>
				<div><GlyphButton glyph="pencil"/></div>
			</div>
		);
	}
}
