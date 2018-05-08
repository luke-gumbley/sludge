import React, { Component } from 'react';
import { connect } from 'react-redux';

import { postStatement } from '../actions/transactions.js';
import { importBuckets } from '../actions/buckets.js';
import Upload from '../components/Upload';
import Download from '../components/Download';

class Header extends Component {

	render() {
		return (
			<div>
				<Upload text='Upload statement' onFile={ this.props.handleStatement }/>
				<Download text='Download buckets' filename='buckets.csv' url='/api/buckets/export' />
				<Upload text='Upload buckets' onFile={ this.props.handleBuckets }/>
				<Download text='Download rules' filename='rules.csv' url='/api/rules/export' />
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		handleStatement: (filename, data) => dispatch(postStatement(filename, data)),
		handleBuckets: (filename, data) => dispatch(importBuckets(data))
	};
}

export default connect(null,mapDispatchToProps)(Header);
