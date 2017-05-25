import React from 'react';
import Bucket from './Bucket.js';
import {applyPatch, createPatch, createTests} from 'rfc6902';

class Transaction extends React.Component {
	constructor(props) {
		super(props);

 		this.handleBucketChange = this.handleBucketChange.bind(this);
	}

	handleBucketChange(bucket) {
		var updatedTransaction = Object.assign({}, this.props.transaction, { bucket: bucket });
		var patch = createPatch(this.props.transaction, updatedTransaction);
		fetch('http://localhost:8080/transaction/' + this.props.transaction.id, {
				method: 'PATCH',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(patch),
			}).then(r => r.json())
			.then(data => this.setState({transactions: data}))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
		console.log(bucket);
	}

	render() {
		return (
			<div className="container">
				<div>{this.props.transaction.party}</div>
				<div>{this.props.transaction.type}</div>
				<div>{this.props.transaction.particulars}</div>
				<div>{this.props.transaction.code}</div>
				<div>{this.props.transaction.reference}</div>
				<div>{this.props.transaction.amount}</div>
				<Bucket bucket={this.props.transaction.bucket} onBucketChange={this.handleBucketChange} />
			</div>
		);
	}
}

module.exports = Transaction;
