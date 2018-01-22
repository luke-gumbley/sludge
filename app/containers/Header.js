import React, { Component } from 'react';
import { connect } from 'react-redux';

import { postStatement } from '../actions/transactions.js';
import { importBuckets } from '../actions/buckets.js';
import Upload from '../components/Upload';
import Download from '../components/Download';

class Header extends Component {

	render() {
		return (
			<div className='container'>
				<div className='cell'>
					<Upload text='Upload statement' onFile={ this.props.handleStatement }/>
				</div>
				<div className='cell'>
					<Download text='Download buckets' url='/api/buckets/export' />
				</div>
				<div className='cell'>
					<Upload text='Upload buckets' onFile={ this.props.handleBuckets }/>
				</div>
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
