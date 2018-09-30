import React, { Component } from 'react';
import { connect } from 'react-redux';

import { postStatement } from '../actions/transactions.js';
import { importBuckets } from '../actions/buckets.js';
import { importRules } from '../actions/rules.js';
import Upload from '../components/Upload';
import Download from '../components/Download';

class Header extends Component {

	render() {
		return (
			<div>
				<Upload text='Upload statement' name='statementUpload' onFile={ this.props.handleStatement }/>
				<Download text='Download buckets' filename='buckets.csv' url='/api/buckets/export' />
				<Upload text='Upload buckets' name='bucketsUpload' onFile={ this.props.handleBuckets }/>
				<Download text='Download rules' filename='rules.csv' url='/api/rules/export' />
				<Upload text='Upload rules' name='rulesUpload' onFile={ this.props.handleRules }/>
			</div>
		);
	}
}

function mapDispatchToProps(dispatch) {
	return {
		handleStatement: (filename, data) => dispatch(postStatement(filename, data)),
		handleBuckets: (filename, data) => dispatch(importBuckets(data)),
		handleRules: (filename, data) => dispatch(importRules(data)),
	};
}

export default connect(null,mapDispatchToProps)(Header);
