import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Column, Table, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';
import moment from 'moment';

import GlyphButton from './GlyphButton';
import { editBucket, deleteBucket } from '../actions/buckets.js';
import { getBuckets } from '../selectors/buckets.js';

class BucketList extends Component {
	rowGetter = ({ index }) => {
		let bucket = this.props.buckets[index];

		const isPeriodic = bucket.date.isValid() && bucket.period > 0;

		const nextDate = moment(bucket.date);
		if(moment().isAfter(nextDate)) {
			const diff = moment().diff(nextDate, bucket.periodUnit, true);
			const periods = Math.ceil(diff / bucket.period);
			nextDate.add(bucket.period * periods, bucket.periodUnit);
		}

		const prev = moment(bucket.date).subtract(bucket.period,bucket.periodUnit);
		const days = bucket.date.diff(prev,'days', true);
		const age = moment().diff(bucket.zeroDate, 'days', true);

		return Object.assign({}, bucket, {
			amount: isPeriodic ? '$' + bucket.amount.toFixed(2) : '',
			period: isPeriodic ? bucket.period + ' ' + bucket.periodUnit : '',
			nextDate: isPeriodic ? nextDate.format('l') : '',
			rate: isPeriodic ? '$' + (bucket.amount / days).toFixed(2) : '',
			balance: '$' + bucket.balance.plus(isPeriodic ? bucket.amount.mul(age / days) : 0).toFixed(2)
		});
	};

	renderAdd = options => {
		const bucket = options.rowData;
		return (<GlyphButton glyph="plus" onClick={this.handleAdd} />);
	};

	renderActions = options => {
		const bucket = options.rowData;
		return (<div>
			<GlyphButton glyph="pencil-alt" onClick={this.handleEdit(bucket.id)} />
			{'\u00A0'}
			<GlyphButton glyph="trash" onClick={this.handleDelete(bucket.id)} />
		</div>);
	};

	handleAdd = () => this.props.dispatch(editBucket(null));

	handleEdit = id => {
		return () => this.props.dispatch(editBucket(id));
	};

	handleDelete = id => {
		return () => this.props.dispatch(deleteBucket(id));
	};

	render() {
		return (<AutoSizer>
			{({height, width}) => (
				<Table
						width={width}
						height={height}
						headerHeight={20}
						rowHeight={30}
						rowCount={(this.props.buckets || []).length}
						rowGetter={this.rowGetter} >
					<Column label='Name' dataKey='name' width={80} flexGrow={1} />
					<Column label='Amount' dataKey='amount' width={80} flexGrow={1} />
					<Column label='Period' dataKey='period' width={80} flexGrow={1} />
					<Column label='Next Date' dataKey='nextDate' width={80} flexGrow={1} />
					<Column label='Daily' dataKey='rate' width={80} flexGrow={1} />
					<Column label='Balance' dataKey='balance' width={80} flexGrow={1} />
					<Column
						dataKey='id'
						headerRenderer={this.renderAdd}
						cellRenderer={this.renderActions}
						width={20}
						flexGrow={0.5} />
				</Table>
			)}
		</AutoSizer>);
	}
}

const mapStateToProps = state => ({
	buckets: getBuckets(state)
});

export default connect(mapStateToProps)(BucketList);
