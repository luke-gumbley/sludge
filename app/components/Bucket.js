import React, { Component } from 'react';
import { connect } from 'react-redux';

class Bucket extends Component {
	render() {
		return (<input type="text" list="buckets" onBlur={e => this.props.onChange(e.target.value)} defaultValue={this.props.bucket.name} />);
	}
}

function mapStateToProps(state, props) {
	return {
		bucket: (state.buckets.items || []).find(b => b.id == props.bucketId) || {}
	};
}

export default connect(mapStateToProps)(Bucket);
