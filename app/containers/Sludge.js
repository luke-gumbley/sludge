import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

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
						<TransactionList transactions={Object.values(this.props.transactions.items).sort((a,b) => a.date > b.date ? -1 : a.date < b.date ? 1 : a.ordinal > b.ordinal ? -1 : 1)} total={this.props.transactions.total} />
					</TabPanel>
					<TabPanel>
						<BucketList buckets={Object.values(this.props.buckets.items)} />
					</TabPanel>
				</Tabs>
				<BucketDataList buckets={Object.values(this.props.buckets.items)} />
				<BucketEditor bucketId={this.props.buckets.editBucketId}/>
			</div>
		);
	}

	componentDidMount() {
		const { dispatch } = this.props;
		dispatch(getBuckets());
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
