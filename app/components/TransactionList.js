import React, { Component } from 'react';
import { connect } from 'react-redux';
import { InfiniteLoader, Column, Table, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';

import BucketPicker from './BucketPicker';
import { categoriseTransaction } from '../actions/transactions.js';
import { getTransactions } from '../actions/transactions.js';
import { getSortedTransactions } from '../selectors/transactions.js';

class TransactionList extends Component {

	constructor() {
		super();

		this.infiniteLoader = React.createRef();

		this.state = {
			loaded: 0,
		};
	}

	isRowLoaded = ({ index }) => {
		return this.state.loaded > index || !!this.props.transactions[index];
	};

	rowClassName = ({ index }) => {
		return ((index + 1) % 2) ? 'altRow' : undefined;
	};

	rowGetter = ({ index }) => {
		const transaction = this.props.transactions[index];
		return (transaction && Object.assign({}, transaction, {
			date: transaction.date.format('l'),
			amount: transaction.amount.toFixed(2)
		})) || {};
	};

	renderPicker = options => {
		const transaction = options.rowData;
		return transaction
			? <BucketPicker
				name="txnBucket"
				bucketId={transaction.bucketId}
				onChange={bucket => this.props.onChange(transaction.id, bucket)} />
			: <div />
	};

	loadMoreRows = ({ startIndex, stopIndex }) => {
		this.setState({ loaded: stopIndex + 1 });
		return this.props.dispatch(getTransactions(startIndex, stopIndex - startIndex + 1, this.props.filter));
	};

	componentDidMount() {
		// load first set
		if(this.props.total === undefined)
			this.loadMoreRows({startIndex: 0, stopIndex: 10});
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if(this.props.total === undefined && prevProps.total !== undefined) {
			if(this.infiniteLoader.current)
				this.infiniteLoader.current.resetLoadMoreRowsCache();
			// load further sets
			this.loadMoreRows({startIndex: 0, stopIndex: 10});
		}
	}

	render() {
		return (<AutoSizer>
			{({height, width}) => (
				<InfiniteLoader
						ref={this.infiniteLoader}
						isRowLoaded={this.isRowLoaded}
						loadMoreRows={this.loadMoreRows}
						rowCount={this.props.total || 0}
						minimumBatchSize={30}
						threshold={60} >
					{({ onRowsRendered, registerChild }) => (
						<Table
								width={width}
								height={height}
								headerHeight={20}
								rowHeight={30}
								rowCount={this.props.total || 0}
								rowClassName={this.rowClassName}
								rowGetter={this.rowGetter}
								onRowsRendered={onRowsRendered}
								ref={registerChild} >
							<Column label='Date' dataKey='date' width={80} />
							<Column label='Account' dataKey='account' width={150} />
							<Column label='Type' dataKey='type' width={50} />
							<Column label='Party' dataKey='party' width={150} flexGrow={1} />
							<Column label='Particulars' dataKey='particulars' width={140} />
							<Column label='Code' dataKey='code' width={140} />
							<Column label='Reference' dataKey='reference' width={140} />
							<Column label='Amount' className='transactionAmount' dataKey='amount' width={100} />
							<Column label='Bucket' dataKey='bucket' width={150} cellRenderer={this.renderPicker} />
						</Table>
					)}
				</InfiniteLoader>
            )}
		</AutoSizer>);
	}
}

const mapStateToProps = state => ({
	transactions: getSortedTransactions(state),
	total: state.transactions.total,
	filter: state.transactions.filter
});

const mapDispatchToProps = dispatch => ({
	onChange: (id, bucket) => dispatch(categoriseTransaction(id, bucket)),
	dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(TransactionList);
