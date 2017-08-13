import React, { Component } from 'react';
import TransactionList from './TransactionList.js';
import BucketDataList from './BucketDataList.js';

export default class Sludge extends Component {
	render() {
		return (
			<div>
				<TransactionList transactions={this.props.transactions} />
				<BucketDataList buckets={this.props.buckets} />
			</div>
		);
	}
}
