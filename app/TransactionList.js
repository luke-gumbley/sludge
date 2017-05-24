import React from 'react';
import Transaction from './Transaction';

class TransactionList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {transactions: []};
	}

	componentDidMount() {
		fetch("http://localhost:3000/transaction")
			.then(r => r.json())
			.then(data => this.setState({transactions: data}))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
	}

	render() {
		var transactions = this.state.transactions.map(transaction => {
			return (<Transaction key={transaction.id} {...transaction} />);
		});
		return (<div>{transactions}</div>);
	}
}

module.exports = TransactionList;
