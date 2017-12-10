import React, { Component } from 'react';
import { connect } from 'react-redux';

class BucketPicker extends Component {
	constructor() {
		super();
		this.handleBlur = this.handleBlur.bind(this);
	}

	handleBlur(e) {
		if(e.target.value !== (this.props.bucket.name || ''))
			this.props.onChange(e.target.value);
	}

	render() {
		return (<input type="text" list="buckets" onBlur={this.handleBlur} defaultValue={this.props.bucket.name} />);
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.bucketId] || {}
	};
}

export default connect(mapStateToProps)(BucketPicker);
