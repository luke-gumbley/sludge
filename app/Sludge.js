import React from 'react';
import TransactionList from './TransactionList.js';
import BucketDataList from './BucketDataList.js';

class Sludge extends React.Component {
	constructor(props) {
		super(props);
		this.state = {transactions: [], buckets: []};
	}

	componentDidMount() {
		fetch("http://localhost:8080/transaction")
			.then(r => r.json())
			.then(data => this.setState({transactions: data}))
			.catch(ex => {console.log('whoops!'); console.log(ex); });

		fetch("http://localhost:8080/bucket")
			.then(r => r.json())
			.then(data => this.setState({buckets: data}))
			.catch(ex => {console.log('whoops!'); console.log(ex); });
	}

	render() {
		return (
			<div>
				<TransactionList transactions={this.state.transactions} />
				<BucketDataList buckets={this.state.buckets} />
			</div>
		);
	}
}

module.exports = Sludge;
