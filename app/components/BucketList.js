import React, { Component } from 'react';
import Bucket from './Bucket';

export default class BucketList extends Component {
	render() {
		var buckets = this.props.buckets.map(bucket => {
			return (<Bucket key={bucket.id} bucket={bucket} />);
		});
		return (<div>{buckets}</div>);
	}
}
