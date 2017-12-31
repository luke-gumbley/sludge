import React, { Component } from 'react';

export default class GlyphButton extends Component {
	render() {
		return (<i className={'fa glyph fa-' + this.props.glyph} onClick={this.props.onClick} />);
	}
}
