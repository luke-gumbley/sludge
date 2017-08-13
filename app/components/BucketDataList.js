import React, { Component } from 'react';

export default class BucketDataList extends Component {
	render() {
		var buckets = this.props.buckets.map(bucket => { return (<option key={bucket.id} value={bucket.name} />); });
		return (<datalist id="buckets">{buckets}</datalist>);
	}
}
