import React, { Component } from 'react';
import { connect } from 'react-redux';
import Autosuggest from 'react-autosuggest';

export default class Filter extends Component {

	constructor(props) {
		super(props);

		console.log('MAKEY FILTER VAL '.concat(props.value));
		this.state = {
			value: props.value || '',
			suggestions: []
		};
	}

	static defaultProps = {
		values: [],
		defaults: []
	};

	getSuggestions = value => {
		const val = value.trim().toLowerCase();
		const valueFilter = v => !val.length
			|| this.getSuggestionValue(v).toLowerCase().slice(0, val.length) === val;

		return this.props.defaults
			.map(d => this.props.property ? {[this.props.property]: d} : d)
			.concat(this.props.values.filter(valueFilter));
	};

	onSuggestionsFetchRequested = ({ value }) => {
		this.setState({ suggestions: this.getSuggestions(value) });
	};

	handleBlur = (event, { highlightedSuggestion }) => {
		this.props.onBlur(event.target.value);
	};

	onChange = (event, { newValue, method }) => {
		this.setState({ value: newValue });
	};

	onSuggestionsClearRequested = () => {
		this.setState({ suggestions: [] });
	};

	getSuggestionValue = s => this.props.property ? s[this.props.property] : s;

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
