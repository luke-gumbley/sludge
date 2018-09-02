import React, { Component } from 'react';
import { connect } from 'react-redux';

class Bucket extends Component {
	render() {
		return this.props.bucket.name;
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: state.buckets.items[props.bucketId] || { name: '' }
	};
}

export default connect(mapStateToProps)(Bucket);
