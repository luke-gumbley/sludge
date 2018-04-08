import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getBuckets } from '../selectors/buckets.js';

class BucketDataList extends Component {
	render() {
		var buckets = this.props.buckets.map(bucket => { return (<option key={bucket.id} value={bucket.name} />); });
		return (<datalist id="buckets">{buckets}</datalist>);
	}
}

const mapStateToProps = state => ({
	buckets: getBuckets(state)
});

export default connect(mapStateToProps)(BucketDataList);
