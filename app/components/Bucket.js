import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'Moment';

export default class Bucket extends Component {

	render() {
		const renderAmount = bucket => {
			// naive, but Intl.NumberFormat was weird
			return '$' + bucket.amount.toFixed(2);
		};

		const renderPeriod = bucket => {
			return (bucket.periodMonths ? `${bucket.periodMonths}mo ` : '')
				+ (bucket.periodDays ? `${bucket.periodDays}d` : '');
		};

		const renderRate = bucket => {
			var next = moment(bucket.zeroDate);
			var prev = moment(next).subtract(bucket.periodMonths,'months').subtract(bucket.periodDays, 'days');
			return '$' + (bucket.amount / next.diff(prev,'days')).toFixed(2);
		};

		return (
			<div className="container">
				<div>{this.props.bucket.name}</div>
				<div>{renderAmount(this.props.bucket)}</div>

				<div>{renderPeriod(this.props.bucket)}</div>
				<div>{this.props.bucket.nextDate.format('l')}</div>
				<div>{renderRate(this.props.bucket)}</div>

				<div>over/under</div>
				<div>vis</div>
			</div>
		);
	}
}
