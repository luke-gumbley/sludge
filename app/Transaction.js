import React from 'react';
import Bucket from './Bucket.js';

class Transaction extends React.Component {
	constructor(props) {
		super(props);

 		this.handleBucketChange = this.handleBucketChange.bind(this);
	}

	handleBucketChange(bucket) {
		console.log(bucket);
	}

	render() {
		return (
			<div className="container">
				<div>{this.props.party}</div>
				<div>{this.props.type}</div>
				<div>{this.props.particulars}</div>
				<div>{this.props.code}</div>
				<div>{this.props.reference}</div>
				<div>{this.props.amount}</div>
				<Bucket bucket={this.props.bucket} onBucketChange={this.handleBucketChange} />
			</div>
		);
	}
}

module.exports = Transaction;
