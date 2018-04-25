import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import FilterBar from '../components/FilterBar';
import TransactionList from '../components/TransactionList';
import BucketList from '../components/BucketList';
import BucketDataList from '../components/BucketDataList';
import BucketEditor from '../components/BucketEditor';
import Header from './Header';

import { getBuckets } from '../actions/buckets';
import { getTransactions } from '../actions/transactions';

class Sludge extends Component {
	render() {
		return (
			<div className='main'>
				<Header />
				<Tabs>
					<TabList>
						<Tab>Transactions</Tab>
						<Tab>Buckets</Tab>
					</TabList>
					<TabPanel>
						<FilterBar filter={this.props.transactions.filter} />
						<TransactionList />
					</TabPanel>
					<TabPanel>
						<BucketList />
					</TabPanel>
				</Tabs>
				<BucketDataList />
				<BucketEditor bucketId={this.props.buckets.editBucketId}/>
			</div>
		);
	}

	componentDidMount() {
		const { dispatch } = this.props;
		dispatch(getBuckets());
		dispatch(getTransactions(0, 10, this.props.transactions.filter));
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
