import React, { Component } from 'react';
import Bucket from './Bucket';
import { categoriseTransaction } from '../actions/transactions.js';
import { connect } from 'react-redux';

class Transaction extends Component {

	render() {
		return (
			<div className="container">
				<div>{this.props.transaction.party}</div>
				<div>{this.props.transaction.type}</div>
				<div>{this.props.transaction.particulars}</div>
				<div>{this.props.transaction.code}</div>
				<div>{this.props.transaction.reference}</div>
				<div>{this.props.transaction.amount}</div>
				<Bucket bucketId={this.props.transaction.bucketId} onChange={bucket => this.props.onChange(this.props.transaction.id, bucket)} />
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onChange: (id, bucket) => dispatch(categoriseTransaction(id, bucket))
	};
}

export default connect(null, mapDispatchToProps)(Transaction);