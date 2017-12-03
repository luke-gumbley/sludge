import React, { Component } from 'react';
import { connect } from 'react-redux';
import TransactionList from '../components/TransactionList';
import BucketDataList from '../components/BucketDataList';

import { fetchBuckets } from '../actions/buckets';
import { getTransactions } from '../actions/transactions';

class Sludge extends Component {
	render() {
		return (
			<div>
				<TransactionList transactions={Object.values(this.props.transactions.items)} />
				<BucketDataList buckets={Object.values(this.props.buckets.items)} />
			</div>
		);
	}

	componentDidMount() {
		const { dispatch } = this.props;
		dispatch(fetchBuckets());
		dispatch(getTransactions());
	}

}

function mapStateToProps(state) {
	const { transactions, buckets } = state;

	return {
		transactions,
		buckets
	};
}

export default connect(mapStateToProps)(Sludge)
