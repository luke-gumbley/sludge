import React, { Component } from 'react';
import { connect } from 'react-redux';

export default class Search extends Component {

	constructor(props) {
		super(props);
		this.state = { value: props.defaultValue || '' };
	}

	handleChange = (event) => {
		this.setState({ value: event.target.value });
	};

	handleKeyPress = (event) => {
		if(event.key=='Enter') this.handleBlur();
	};

	handleBlur = (event) => {
		this.props.onBlur(this.state.value === ''
			? undefined
			: this.state.value, this.props.defaultValue)
	};

	render() {
		return (<input
			type="text"
			name="searchFilter"
			className="react-autosuggest__input"
			placeholder={this.props.placeholder}
			style={{ zIndex: 1 }}
			value={this.state.value}
			onBlur={this.handleBlur}
			onKeyPress={this.handleKeyPress}
			onChange={this.handleChange} />);
	}
}
