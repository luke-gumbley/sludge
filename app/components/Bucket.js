import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import GlyphButton from './GlyphButton';
import { editBucket } from '../actions/buckets.js';

class Bucket extends Component {

	render() {
		const renderAmount = bucket => {
			// naive, but Intl.NumberFormat was weird
			return '$' + bucket.amount.toFixed(2);
		};

		const renderPeriod = bucket => {
			return (bucket.periodMonths ? `${bucket.periodMonths}mo ` : '')
				+ (bucket.periodDays ? `${bucket.periodDays}d` : '');
		};

		const prev = bucket => {
			return moment(bucket.nextDate)
				.subtract(bucket.periodMonths,'months')
				.subtract(bucket.periodDays, 'days');
		}

		const days = bucket => {
			return bucket.nextDate.diff(prev(bucket),'days');
		}

		const renderRate = bucket => {
			return '$' + (bucket.amount / days(bucket)).toFixed(2);
		};

		const renderBalance = bucket => {
			return '$' + bucket.balance.plus(bucket.amount.mul(moment().diff(bucket.zeroDate, 'days', true) / days(bucket))).toFixed(2);
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
				<div><GlyphButton glyph="pencil" onClick={() => this.props.onEdit(this.props.bucket.id)} /></div>
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onEdit: id => dispatch(editBucket(id))
	};
}

export default connect(null, mapDispatchToProps)(Bucket);
