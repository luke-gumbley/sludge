import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Column, Table, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';
import moment from 'moment';

import GlyphButton from './GlyphButton';
import { editBucket, deleteBucket } from '../actions/buckets.js';
import { getBuckets } from '../selectors/buckets.js';

class BucketList extends Component {
	rowClassName = ({ index }) => {
		if(index == -1) return undefined;
		let bucket = this.props.buckets[index];
		return bucket.highlight || ((index % 2) && 'altRow') || undefined;
	};

	rowGetter = ({ index }) => this.props.buckets[index];

	renderAdd = options => {
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
						rowClassName={this.rowClassName}
						rowGetter={this.rowGetter} >
					<Column label='Name' dataKey='name' width={80} flexGrow={1} />
					<Column label='Amount' dataKey='amount' width={80} flexGrow={1} />
					<Column label='Period' dataKey='period' width={80} flexGrow={1} />
					<Column label='Next Date' dataKey='nextDate' width={80} flexGrow={1} />
					<Column label='Daily' dataKey='rate' width={80} flexGrow={1} />
					<Column label='Balance' dataKey='actual' width={80} flexGrow={1} />
					<Column label='Variance' dataKey='variance' width={80} flexGrow={1} />
					<Column label='Budget' dataKey='budget' width={80} flexGrow={1} />
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
	buckets: getBuckets(state).map(bucket => {
		const calc = bucket.isPeriodic ? bucket.calculate() : {};
		const variance = bucket.isPeriodic
			? calc.actual.gt(bucket.amount)
				? calc.actual.sub(bucket.amount)
				: calc.projected.lt(0)
					? calc.projected
					: 0
			: 0;

		return Object.assign({}, bucket, {
			amount: bucket.isPeriodic ? '$' + bucket.amount.toFixed(2) : '',
			period: bucket.isPeriodic ? bucket.period + ' ' + bucket.periodUnit : '',
			nextDate: bucket.isPeriodic ? calc.nextEmpty.format('l') : '',
			rate: bucket.isPeriodic ? '$' + (bucket.amount / calc.periodDays).toFixed(2) : '',
			actual: bucket.isPeriodic ? '$' + calc.actual.toFixed(2) : '',
			variance: variance !== 0 ? '$' + variance.toFixed(2) : '',
			highlight: variance < 0 ? 'redRow' : variance > 0 ? 'greenRow' : undefined
		});
	})
});

export default connect(mapStateToProps)(BucketList);
