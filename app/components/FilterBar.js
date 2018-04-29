import React, { Component } from 'react';
import { connect } from 'react-redux';
import Filter from '../components/Filter';
import Search from '../components/Search';
import { getSortedTransactions } from '../selectors/transactions.js';
import { getBuckets } from '../selectors/buckets.js';
import { updateFilter } from '../actions/transactions.js';

class FilterBar extends Component {

	render() {
		/*
		bucket (specific buckets or uncategorised)
		ppcr (text search - regex?)
		date (min/max, default to specific day)
		account (selector)
		amount (min/max)
		*/
		const sizes = {
			'Date': 80,
			'Account': 150,
			'Type': 50,
			'Party': 150,
			'Particulars': 140,
			'Code': 140,
			'Reference': 140,
			'Amount': 100,
			'Bucket': 150
		}

		const accountFilters = this.props.accounts.map(account => ({ key: account, value: account }));

		const bucketFilters = [{ key: null, value: '<None>', default: true}]
			.concat(this.props.buckets.map(b => ({ key: b.id, value: b.name}) ));

		return (
			<div className='filterBar'>
				<div style={{flexBasis: '80px'}} />
				<div style={{flexBasis: '150px'}}>
					<Filter
						defaultKey={this.props.filter.account}
						values={accountFilters}
						onBlur={this.props.updateFilter('account')}
						placeholder='Filter account...' />
					</div>
				<div style={{flexBasis: '50px'}} />
				<div style={{flex: '570px'}}>
					<Search
						defaultValue={this.props.filter.search}
						onBlur={this.props.updateFilter('search')}
						placeholder='Search...' />
				</div>
				<div style={{flexBasis: '100px'}} />
				<div style={{flexBasis: '150px'}}>
					<Filter
						defaultKey={this.props.filter.bucketId}
						values={bucketFilters}
						onBlur={this.props.updateFilter('bucketId')}
						placeholder='Filter buckets...' />
				</div>
			</div>
		);
	}
}

const mapDispatchToProps = dispatch => {
	return {
		updateFilter: prop => ((value, prev) => {
			return prev !== value && dispatch(updateFilter({ [prop]: value }));
		})
	};
}

const mapStateToProps = state => {
	let transactions = getSortedTransactions(state);
	let accounts = transactions.map(t => t.account);
	accounts = accounts.filter((account, i, array) => array.indexOf(account) === i);

	return ({
		buckets: getBuckets(state),
		accounts/*: getSortedTransactions(state).map(t => t.account)
			.filter((account, i, array) => array.indexOf(account) === i)*/
	});
}

export default connect(mapStateToProps, mapDispatchToProps)(FilterBar);
