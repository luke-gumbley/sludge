import React, { Component } from 'react';
import Transaction from './Transaction';

export default class TransactionList extends Component {
	render() {
		var transactions = this.props.transactions.map(transaction => {
			return (<Transaction key={transaction.id} transaction={transaction} />);
		});
		return (<div>{transactions}</div>);
	}
}
