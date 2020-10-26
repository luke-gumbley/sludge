import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import FilterBar from '../components/FilterBar';
import TransactionList from '../components/TransactionList';
import RuleList from '../components/RuleList';
import RuleEditor from '../components/RuleEditor';
import BucketList from '../components/BucketList';
import BucketDataList from '../components/BucketDataList';
import BucketEditor from '../components/BucketEditor';
import Budgets from '../components/Budgets';
import Header from './Header';

import { getTransactions } from '../actions/transactions';
import { getRules } from '../actions/rules';
import { getBuckets } from '../actions/buckets';

class Sludge extends Component {
	render() {
		return (
			<div className='main'>
				<Header />
				<Budgets />
				<Tabs>
					<TabList>
						<Tab>Transactions</Tab>
						<Tab>Rules</Tab>
						<Tab>Buckets</Tab>
					</TabList>
					<TabPanel style={{display:'flex', 'flex-direction': 'column'}}>
						<FilterBar filter={this.props.transactions.filter} />
						<div style={{flex:1}}><TransactionList /></div>
					</TabPanel>
					<TabPanel>
						<RuleList />
					</TabPanel>
					<TabPanel>
						<BucketList />
					</TabPanel>
				</Tabs>
				<BucketDataList />
				<RuleEditor defaultRule={this.props.rules.editRule}/>
				<BucketEditor bucketId={this.props.buckets.editBucketId}/>
			</div>
		);
	}

	componentDidMount() {
		const { dispatch } = this.props;
		dispatch(getBuckets());
		dispatch(getRules());
	}

}

function mapStateToProps(state) {
	const { transactions, rules, buckets } = state;

	return {
		transactions,
		rules,
		buckets
	};
}

export default connect(mapStateToProps)(Sludge)
