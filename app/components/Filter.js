import React, { Component } from 'react';
import { connect } from 'react-redux';
import Autosuggest from 'react-autosuggest';

export default class Filter extends Component {

	// props.values = [{ key: 10, value: 'foobar', default: true }]

	constructor(props) {
		super(props);

		this.state = {
			value: (props.values.find(v => v.key === props.defaultKey) || { value: props.defaultValue || '' }).value,
			suggestions: []
		};
	}

	static defaultProps = {
		values: []
	};

	storeInputReference = autosuggest => {
		if (autosuggest !== null) {
			this.input = autosuggest.input;
		}
	}

	getSuggestions = value => {
		const val = value.trim().toLowerCase();
		const valueFilter = v => !v.default && (!val.length
			|| this.getSuggestionValue(v).toLowerCase().slice(0, val.length) === val);

		return this.props.values.filter(v => v.default)
			.concat(this.props.values.filter(valueFilter));
	};

	onSuggestionsFetchRequested = ({ value }) => {
		this.setState({ suggestions: this.getSuggestions(value) });
	};

	handleKeyPress = (event) => {
		if(event.key === 'Enter') this.handleBlur();
	};

	handleBlur = (event) => {
		this.props.onBlur(this.state.value === ''
			? undefined
			: (this.props.values.find(s => s.value === this.state.value) || { key: undefined }).key, this.props.defaultKey)
	};

	onChange = (event, { newValue, method }) => {
		const me = this;
		this.setState({ value: newValue }, method === 'click' ? () => {
			me.input.blur();
			me.handleBlur();
		} : undefined);
	};

	onSuggestionsClearRequested = () => {
		this.setState({ suggestions: [] });
	};

	getSuggestionValue = s => s.value;

	renderSuggestion = suggestion => {
		return (<div>{this.getSuggestionValue(suggestion)}</div>);
	};

	render() {
		return (<Autosuggest
				suggestions={this.state.suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}
				getSuggestionValue={this.getSuggestionValue}
				shouldRenderSuggestions={() => true}
				renderSuggestion={this.renderSuggestion}
				ref={this.storeInputReference}
				inputProps={{
					placeholder: this.props.placeholder,
					value: this.state.value,
					onKeyPress: this.handleKeyPress,
					onChange: this.onChange,
					onBlur: this.handleBlur}} />);
	}
}
