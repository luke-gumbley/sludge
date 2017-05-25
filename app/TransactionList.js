import React from 'react';
import Transaction from './Transaction.js';

class TransactionList extends React.Component {
	render() {
		var transactions = this.props.transactions.map(transaction => {
			return (<Transaction key={transaction.id} transaction={transaction} />);
		});
		return (<div>{transactions}</div>);
	}
}

module.exports = TransactionList;
