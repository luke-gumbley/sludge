import React, { Component } from 'react';
import { connect } from 'react-redux';

class BucketPicker extends Component {
	constructor(props) {
		super(props);
		this.state = { value: props.bucket.name, isDirty: false };
	}

	handleFocus = (event) => {
		event.currentTarget.select();
	}

	handleChange = (event) => {
		const value = event.target.value;
		this.setState({ value, isDirty: value !== this.props.bucket.name });
	};

	handleKeyPress = (event) => {
		if(event.key=='Enter') event.currentTarget.blur();
	};

	handleBlur = (event) => {
		if(this.props.onChange && this.state.value !== this.props.bucket.name)
			this.props.onChange(this.state.value);
	};

	static getDerivedStateFromProps(props, state) {
		return state.isDirty
			? null
			: { value: props.bucket.name, isDirty: false };
	}

	render() {
		return (<input
			type="text"
			list="buckets"
			name="bucket"
			onFocus={this.handleFocus}
			onBlur={this.handleBlur}
			onChange={this.handleChange}
			onKeyPress={this.handleKeyPress}
			value={this.state.value} />);
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.bucketId] || { name: '' }
	};
}

export default connect(mapStateToProps)(BucketPicker);
