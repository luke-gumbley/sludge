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

	handleBlur = (event, { highlightedSuggestion }) => {
		this.props.onBlur(event.target.value === ''
			? undefined
			: this.props.values.find(s => s.value === event.target.value))
	};

	onChange = (event, { newValue, method }) => {
		this.setState({ value: newValue });
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
				inputProps={{
					placeholder: this.props.placeholder,
					value: this.state.value,
					onChange: this.onChange,
					onBlur: this.handleBlur}} />);
	}
}
