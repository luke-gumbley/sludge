import React, { Component } from 'react';
import Bucket from './Bucket';

export default class Transaction extends Component {
	render() {
		return (
			<div className="container">
				<div>{this.props.transaction.party}</div>
				<div>{this.props.transaction.type}</div>
				<div>{this.props.transaction.particulars}</div>
				<div>{this.props.transaction.code}</div>
				<div>{this.props.transaction.reference}</div>
				<div>{this.props.transaction.amount}</div>
				<Bucket bucket={this.props.transaction.bucket} />
			</div>
		);
	}
}
