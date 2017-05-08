import React from 'react';

class Transaction extends React.Component {
	constructor(props) {
		super(props);
		//this.state = {date: new Date()};
	}

	/*
	componentDidMount() {
		this.timerID = setInterval( () => this.tick(), 1000 );
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
	}

	tick() {
		this.setState({
			date: new Date()
		});
	}
	 */

	render() {
		return (
			<div className="container">
				<div>{this.props.party}</div>
				<div>{this.props.type}</div>
				<div>{this.props.particulars}</div>
				<div>{this.props.code}</div>
				<div>{this.props.reference}</div>
				<div>{this.props.amount}</div>
			</div>
		);
	}
}

module.exports = Transaction;