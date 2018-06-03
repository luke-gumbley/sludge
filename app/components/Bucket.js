import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import GlyphButton from './GlyphButton';
import { editBucket, deleteBucket } from '../actions/buckets.js';

class Bucket extends Component {

	handleEdit = () => {
		this.props.dispatch(editBucket(this.props.bucket.id));
	};

	handleDelete = () => {
		this.props.dispatch(deleteBucket(this.props.bucket.id));
	};

	render() {
		// naive, but Intl.NumberFormat was weird
		const renderAmount = bucket => '$' + bucket.amount.toFixed(2);
		const renderPeriod = bucket => bucket.period + ' ' + bucket.periodUnit;
		const prev = bucket => moment(bucket.nextDate).subtract(bucket.period,bucket.periodUnit);
		const days = bucket => bucket.nextDate.diff(prev(bucket),'days', true);
		const renderRate = bucket => '$' + (bucket.amount / days(bucket)).toFixed(2);

		const renderBalance = bucket => {
			const age = moment().diff(bucket.zeroDate, 'days', true);
			return '$' + bucket.balance.plus(bucket.amount.mul(age / days(bucket))).toFixed(2);
		};

		return (
			<div className="container">
				<div>{this.props.bucket.name}</div>
				<div>{renderAmount(this.props.bucket)}</div>

				<div>{renderPeriod(this.props.bucket)}</div>
				<div>{this.props.bucket.nextDate.format('l')}</div>
				<div>{renderRate(this.props.bucket)}</div>

				<div>{renderBalance(this.props.bucket)}</div>
				<div>vis</div>
				<div>
					<GlyphButton glyph="pencil" onClick={this.handleEdit} />
					{'\u00A0'}
					<GlyphButton glyph="trash" onClick={this.handleDelete} />
				</div>
			</div>
		);
	}
}

export default connect()(Bucket);
