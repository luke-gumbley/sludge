import React from 'react';

class BucketDataList extends React.Component {
	render() {
		var buckets = this.props.buckets.map(bucket => { return (<option key={bucket.id} value={bucket.name} />); });
		return (<datalist id="buckets">{buckets}</datalist>);
	}
}

module.exports = BucketDataList;
