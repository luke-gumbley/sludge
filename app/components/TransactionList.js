import React, { Component } from 'react';
import { connect } from 'react-redux';
import { InfiniteLoader, Column, Table, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';

import BucketPicker from './BucketPicker';
import { categoriseTransaction } from '../actions/transactions.js';
import { getTransactions } from '../actions/transactions.js';

class TransactionList extends Component {

	constructor() {
		super();
		this.renderPicker = this.renderPicker.bind(this);
		this.isRowLoaded = this.isRowLoaded.bind(this);
		this.rowGetter = this.rowGetter.bind(this);
	}

	isRowLoaded({ index }) {
		return !!this.props.transactions[index];
	}

	rowGetter({ index }) {
		const transaction = this.props.transactions[index];
		return (transaction && Object.assign({}, transaction, {
			date: transaction.date.format('l'),
			amount: transaction.amount.toFixed(2)
		})) || {};
	}

	renderPicker(options) {
		const transaction = options.rowData;
		return transaction ? <BucketPicker bucketId={transaction.bucketId} onChange={bucket => this.props.onChange(transaction.id, bucket)} /> : <div />
	}

	render() {
		return (<AutoSizer>
			{({height, width}) => (
				<InfiniteLoader
						isRowLoaded={this.isRowLoaded}
						loadMoreRows={this.props.loadMoreRows}
						rowCount={this.props.total}
						minimumBatchSize={30}
						threshold={60} >
					{({ onRowsRendered, registerChild }) => (
						<Table
								width={width}
								height={height}
								headerHeight={20}
								rowHeight={30}
								rowCount={this.props.total}
								rowGetter={this.rowGetter}
								onRowsRendered={onRowsRendered}
								ref={registerChild} >
							<Column label='Date' dataKey='date' width={80} />
							<Column label='Party' dataKey='party' width={150} flexGrow={1} />
							<Column label='Type' dataKey='type' width={50} />
							<Column label='Particulars' dataKey='particulars' width={140} />
							<Column label='Code' dataKey='code' width={140} />
							<Column label='Reference' dataKey='reference' width={140} />
							<Column label='Amount' dataKey='amount' width={100} />
							<Column label='Bucket' dataKey='bucket' width={150} cellRenderer={this.renderPicker} />
						</Table>
					)}
				</InfiniteLoader>
            )}
		</AutoSizer>);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onChange: (id, bucket) => dispatch(categoriseTransaction(id, bucket)),
		loadMoreRows: options => dispatch(getTransactions(options.startIndex, options.stopIndex - options.startIndex))
	};
}

export default connect(null, mapDispatchToProps)(TransactionList);
