import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import FilterBar from '../components/FilterBar.js';
import TransactionList from '../components/TransactionList.js';
import RuleList from '../components/RuleList.js';
import RuleEditor from '../components/RuleEditor.js';
import BucketList from '../components/BucketList.js';
import BucketDataList from '../components/BucketDataList.js';
import BucketEditor from '../components/BucketEditor.js';
import Budgets from '../components/Budgets.js';
import Header from './Header.js';

import { getTransactions } from '../actions/transactions.js';
import { getRules } from '../actions/rules.js';
import { getBuckets } from '../actions/buckets.js';

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
					<TabPanel selectedClassName='flexTab'>
						<FilterBar filter={this.props.transactions.filter} />
						<div style={{flex:1}}><TransactionList /></div>
					</TabPanel>
					<TabPanel selectedClassName='flexTab'>
						<div style={{flex:1}}><RuleList /></div>
					</TabPanel>
					<TabPanel selectedClassName='flexTab'>
						<div style={{flex:1}}><BucketList /></div>
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
